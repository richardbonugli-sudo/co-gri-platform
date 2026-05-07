// Comprehensive database of 195 countries with Country Shock Index (CSI) scores
// CSI scores range from 0-100, calculated using a 7-vector risk model with specific data sources

// 7-Vector Risk Model with Data Sources:
// v1: Conflict & Security (SC1) - Weight: 0.22
//     Sources: GDELT, ACLED, UCDP, SIPRI, CSIS, IISS, embassy advisories
//     Rationale: Direct physical disruption; highest tail-risk to operations and supply continuity
//
// v2: Sanctions & Regulatory Pressure (SC2) - Weight: 0.18
//     Sources: OFAC, EU CFSP, BIS Entity List, UN sanctions
//     Rationale: Binary "off/on" events blocking trade, investment, and capital access
//
// v3: Trade & Logistics Disruption (SC3) - Weight: 0.16
//     Sources: WTO data, USTR, OECD, maritime chokepoints, export-control notices
//     Rationale: Impacts supply chains and delivery times; moderate persistence
//
// v4: Governance & Rule of Law (SC4) - Weight: 0.14
//     Sources: World Bank WGI, Freedom House, Transparency Int'l
//     Rationale: Structural institutional weakness; slower-moving baseline risk
//
// v5: Cyber & Data Sovereignty (SC5) - Weight: 0.12
//     Sources: CISA, ENISA, NetBlocks, national ICT trackers
//     Rationale: Rapidly growing vector; affects data localization and continuity
//
// v6: Public Unrest & Labor Instability (SC6) - Weight: 0.10
//     Sources: OSINT protest data, ACLED, ILO, local labor ministries
//     Rationale: Episodic risk to production and logistics; short-duration events
//
// v7: Currency & Capital Controls (SC7) - Weight: 0.08
//     Sources: IMF AREAER, BIS, FX volatility indices, US export controls
//     Rationale: Financial-system stress and access risk; often partially hedged

import { compositeCalculator } from '@/services/csi/compositeCalculator';
import { initializeBaselines } from '@/services/csi/initializeBaseline';
import { initializeChinaSilverEvent } from '@/services/csi/initializeChinaSilverEvent';
import type { CompositeCSI } from '@/types/csi.types';

export interface CountryRiskData {
  country: string;
  region: string;
  csi: number;
  incomeLevel: 'High' | 'Upper-Middle' | 'Lower-Middle' | 'Low';
  regionalHub: boolean;
  // 7-vector breakdown (optional, for detailed analysis)
  vectors?: {
    conflict: number;        // v1: SC1 (0.22 weight)
    sanctions: number;       // v2: SC2 (0.18 weight)
    trade: number;          // v3: SC3 (0.16 weight)
    governance: number;     // v4: SC4 (0.14 weight)
    cyber: number;          // v5: SC5 (0.12 weight)
    unrest: number;         // v6: SC6 (0.10 weight)
    currency: number;       // v7: SC7 (0.08 weight)
  };
}

export const VECTOR_WEIGHTS = {
  conflict: 0.22,
  sanctions: 0.18,
  trade: 0.16,
  governance: 0.14,
  cyber: 0.12,
  unrest: 0.10,
  currency: 0.08
};

export const VECTOR_DATA_SOURCES = {
  conflict: {
    name: 'Conflict & Security (SC1)',
    weight: 0.22,
    sources: 'GDELT, ACLED, UCDP, SIPRI, CSIS, IISS, embassy advisories',
    rationale: 'Direct physical disruption; highest tail-risk to operations and supply continuity.'
  },
  sanctions: {
    name: 'Sanctions & Regulatory Pressure (SC2)',
    weight: 0.18,
    sources: 'OFAC, EU CFSP, BIS Entity List, UN sanctions',
    rationale: 'Binary "off/on" events blocking trade, investment, and capital access.'
  },
  trade: {
    name: 'Trade & Logistics Disruption (SC3)',
    weight: 0.16,
    sources: 'WTO data, USTR, OECD, maritime chokepoints, export-control notices',
    rationale: 'Impacts supply chains and delivery times; moderate persistence.'
  },
  governance: {
    name: 'Governance & Rule of Law (SC4)',
    weight: 0.14,
    sources: 'World Bank WGI, Freedom House, Transparency Int\'l',
    rationale: 'Structural institutional weakness; slower-moving baseline risk.'
  },
  cyber: {
    name: 'Cyber & Data Sovereignty (SC5)',
    weight: 0.12,
    sources: 'CISA, ENISA, NetBlocks, national ICT trackers',
    rationale: 'Rapidly growing vector; affects data localization and continuity.'
  },
  unrest: {
    name: 'Public Unrest & Labor Instability (SC6)',
    weight: 0.10,
    sources: 'OSINT protest data, ACLED, ILO, local labor ministries',
    rationale: 'Episodic risk to production and logistics; short-duration events.'
  },
  currency: {
    name: 'Currency & Capital Controls (SC7)',
    weight: 0.08,
    sources: 'IMF AREAER, BIS, FX volatility indices, US export controls',
    rationale: 'Financial-system stress and access risk; often partially hedged.'
  }
};

export const GLOBAL_COUNTRIES: CountryRiskData[] = [
  // North America (3 countries)
  { country: 'United States', region: 'North America', csi: 35.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Canada', region: 'North America', csi: 30.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Mexico', region: 'North America', csi: 52.0, incomeLevel: 'Upper-Middle', regionalHub: true },

  // Central America & Caribbean (20 countries)
  { country: 'Guatemala', region: 'Central America', csi: 58.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Honduras', region: 'Central America', csi: 62.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'El Salvador', region: 'Central America', csi: 60.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Nicaragua', region: 'Central America', csi: 68.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Costa Rica', region: 'Central America', csi: 38.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Panama', region: 'Central America', csi: 42.0, incomeLevel: 'Upper-Middle', regionalHub: true },
  { country: 'Belize', region: 'Central America', csi: 48.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Cuba', region: 'Caribbean', csi: 72.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Jamaica', region: 'Caribbean', csi: 46.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Haiti', region: 'Caribbean', csi: 78.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Dominican Republic', region: 'Caribbean', csi: 50.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Trinidad and Tobago', region: 'Caribbean', csi: 44.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Bahamas', region: 'Caribbean', csi: 35.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Barbados', region: 'Caribbean', csi: 32.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Saint Lucia', region: 'Caribbean', csi: 36.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Grenada', region: 'Caribbean', csi: 38.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Saint Vincent', region: 'Caribbean', csi: 40.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Antigua and Barbuda', region: 'Caribbean', csi: 34.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Dominica', region: 'Caribbean', csi: 42.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Saint Kitts and Nevis', region: 'Caribbean', csi: 33.0, incomeLevel: 'High', regionalHub: false },

  // South America (12 countries)
  { country: 'Brazil', region: 'South America', csi: 58.0, incomeLevel: 'Upper-Middle', regionalHub: true },
  { country: 'Argentina', region: 'South America', csi: 62.0, incomeLevel: 'Upper-Middle', regionalHub: true },
  { country: 'Chile', region: 'South America', csi: 40.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Colombia', region: 'South America', csi: 56.0, incomeLevel: 'Upper-Middle', regionalHub: true },
  { country: 'Peru', region: 'South America', csi: 54.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Venezuela', region: 'South America', csi: 82.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Ecuador', region: 'South America', csi: 60.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Bolivia', region: 'South America', csi: 64.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Paraguay', region: 'South America', csi: 56.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Uruguay', region: 'South America', csi: 36.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Guyana', region: 'South America', csi: 52.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Suriname', region: 'South America', csi: 54.0, incomeLevel: 'Upper-Middle', regionalHub: false },

  // Western Europe (20 countries)
  { country: 'United Kingdom', region: 'Western Europe', csi: 40.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Germany', region: 'Western Europe', csi: 38.0, incomeLevel: 'High', regionalHub: true },
  { country: 'France', region: 'Western Europe', csi: 42.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Italy', region: 'Western Europe', csi: 44.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Spain', region: 'Western Europe', csi: 36.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Netherlands', region: 'Western Europe', csi: 34.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Belgium', region: 'Western Europe', csi: 36.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Switzerland', region: 'Western Europe', csi: 25.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Austria', region: 'Western Europe', csi: 32.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Sweden', region: 'Western Europe', csi: 28.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Norway', region: 'Western Europe', csi: 26.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Denmark', region: 'Western Europe', csi: 27.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Finland', region: 'Western Europe', csi: 30.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Ireland', region: 'Western Europe', csi: 29.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Portugal', region: 'Western Europe', csi: 38.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Greece', region: 'Western Europe', csi: 50.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Luxembourg', region: 'Western Europe', csi: 28.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Iceland', region: 'Western Europe', csi: 24.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Malta', region: 'Western Europe', csi: 35.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Monaco', region: 'Western Europe', csi: 26.0, incomeLevel: 'High', regionalHub: false },

  // Eastern Europe (17 countries)
  { country: 'Poland', region: 'Eastern Europe', csi: 42.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Czech Republic', region: 'Eastern Europe', csi: 38.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Hungary', region: 'Eastern Europe', csi: 46.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Romania', region: 'Eastern Europe', csi: 48.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Bulgaria', region: 'Eastern Europe', csi: 50.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Slovakia', region: 'Eastern Europe', csi: 40.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Croatia', region: 'Eastern Europe', csi: 42.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Serbia', region: 'Eastern Europe', csi: 54.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Slovenia', region: 'Eastern Europe', csi: 36.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Lithuania', region: 'Eastern Europe', csi: 40.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Latvia', region: 'Eastern Europe', csi: 42.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Estonia', region: 'Eastern Europe', csi: 38.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Bosnia and Herzegovina', region: 'Eastern Europe', csi: 58.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Albania', region: 'Eastern Europe', csi: 52.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'North Macedonia', region: 'Eastern Europe', csi: 50.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Montenegro', region: 'Eastern Europe', csi: 46.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Kosovo', region: 'Eastern Europe', csi: 56.0, incomeLevel: 'Lower-Middle', regionalHub: false },

  // Russia & Former Soviet (11 countries)
  { country: 'Russia', region: 'Eurasia', csi: 78.0, incomeLevel: 'Upper-Middle', regionalHub: true },
  { country: 'Ukraine', region: 'Eastern Europe', csi: 85.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Belarus', region: 'Eastern Europe', csi: 72.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Kazakhstan', region: 'Central Asia', csi: 56.0, incomeLevel: 'Upper-Middle', regionalHub: true },
  { country: 'Uzbekistan', region: 'Central Asia', csi: 60.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Turkmenistan', region: 'Central Asia', csi: 68.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Kyrgyzstan', region: 'Central Asia', csi: 64.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Tajikistan', region: 'Central Asia', csi: 66.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Armenia', region: 'Caucasus', csi: 62.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Azerbaijan', region: 'Caucasus', csi: 64.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Georgia', region: 'Caucasus', csi: 58.0, incomeLevel: 'Upper-Middle', regionalHub: false },

  // Middle East (17 countries)
  { country: 'Turkey', region: 'Middle East', csi: 62.0, incomeLevel: 'Upper-Middle', regionalHub: true },
  { country: 'Saudi Arabia', region: 'Middle East', csi: 58.0, incomeLevel: 'High', regionalHub: true },
  { country: 'United Arab Emirates', region: 'Middle East', csi: 42.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Israel', region: 'Middle East', csi: 68.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Iran', region: 'Middle East', csi: 80.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Iraq', region: 'Middle East', csi: 82.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Syria', region: 'Middle East', csi: 92.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Lebanon', region: 'Middle East', csi: 76.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Jordan', region: 'Middle East', csi: 54.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Kuwait', region: 'Middle East', csi: 48.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Qatar', region: 'Middle East', csi: 44.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Bahrain', region: 'Middle East', csi: 52.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Oman', region: 'Middle East', csi: 46.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Yemen', region: 'Middle East', csi: 90.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Palestine', region: 'Middle East', csi: 88.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Cyprus', region: 'Middle East', csi: 48.0, incomeLevel: 'High', regionalHub: false },
  { country: 'North Korea', region: 'East Asia', csi: 88.0, incomeLevel: 'Low', regionalHub: false },

  // North Africa (6 countries)
  { country: 'Egypt', region: 'North Africa', csi: 64.0, incomeLevel: 'Lower-Middle', regionalHub: true },
  { country: 'Morocco', region: 'North Africa', csi: 50.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Algeria', region: 'North Africa', csi: 62.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Tunisia', region: 'North Africa', csi: 58.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Libya', region: 'North Africa', csi: 84.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Sudan', region: 'North Africa', csi: 86.0, incomeLevel: 'Low', regionalHub: false },

  // Sub-Saharan Africa (48 countries)
  { country: 'South Africa', region: 'Southern Africa', csi: 54.0, incomeLevel: 'Upper-Middle', regionalHub: true },
  { country: 'Nigeria', region: 'West Africa', csi: 68.0, incomeLevel: 'Lower-Middle', regionalHub: true },
  { country: 'Kenya', region: 'East Africa', csi: 60.0, incomeLevel: 'Lower-Middle', regionalHub: true },
  { country: 'Ethiopia', region: 'East Africa', csi: 72.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Ghana', region: 'West Africa', csi: 52.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Tanzania', region: 'East Africa', csi: 56.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Uganda', region: 'East Africa', csi: 62.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Angola', region: 'Southern Africa', csi: 66.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Mozambique', region: 'Southern Africa', csi: 68.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Zambia', region: 'Southern Africa', csi: 58.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Zimbabwe', region: 'Southern Africa', csi: 74.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Botswana', region: 'Southern Africa', csi: 42.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Namibia', region: 'Southern Africa', csi: 46.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Mauritius', region: 'East Africa', csi: 36.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Rwanda', region: 'East Africa', csi: 54.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Senegal', region: 'West Africa', csi: 50.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Ivory Coast', region: 'West Africa', csi: 58.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Cameroon', region: 'Central Africa', csi: 64.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Democratic Republic of Congo', region: 'Central Africa', csi: 82.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Republic of Congo', region: 'Central Africa', csi: 70.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Gabon', region: 'Central Africa', csi: 56.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Equatorial Guinea', region: 'Central Africa', csi: 68.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Chad', region: 'Central Africa', csi: 78.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Central African Republic', region: 'Central Africa', csi: 88.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Mali', region: 'West Africa', csi: 80.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Burkina Faso', region: 'West Africa', csi: 76.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Niger', region: 'West Africa', csi: 74.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Guinea', region: 'West Africa', csi: 70.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Benin', region: 'West Africa', csi: 54.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Togo', region: 'West Africa', csi: 60.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Sierra Leone', region: 'West Africa', csi: 66.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Liberia', region: 'West Africa', csi: 68.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Mauritania', region: 'West Africa', csi: 64.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Gambia', region: 'West Africa', csi: 56.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Guinea-Bissau', region: 'West Africa', csi: 72.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Somalia', region: 'East Africa', csi: 94.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'South Sudan', region: 'East Africa', csi: 90.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Eritrea', region: 'East Africa', csi: 80.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Djibouti', region: 'East Africa', csi: 62.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Burundi', region: 'East Africa', csi: 76.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Malawi', region: 'Southern Africa', csi: 60.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Lesotho', region: 'Southern Africa', csi: 52.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Eswatini', region: 'Southern Africa', csi: 54.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Madagascar', region: 'East Africa', csi: 64.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Comoros', region: 'East Africa', csi: 66.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Seychelles', region: 'East Africa', csi: 38.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Cape Verde', region: 'West Africa', csi: 42.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Sao Tome and Principe', region: 'Central Africa', csi: 58.0, incomeLevel: 'Lower-Middle', regionalHub: false },

  // East Asia (6 countries)
  { country: 'China', region: 'East Asia', csi: 75.0, incomeLevel: 'Upper-Middle', regionalHub: true },
  { country: 'Japan', region: 'East Asia', csi: 32.0, incomeLevel: 'High', regionalHub: true },
  { country: 'South Korea', region: 'East Asia', csi: 48.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Taiwan', region: 'East Asia', csi: 52.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Hong Kong', region: 'East Asia', csi: 58.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Mongolia', region: 'East Asia', csi: 54.0, incomeLevel: 'Lower-Middle', regionalHub: false },

  // Southeast Asia (11 countries)
  { country: 'Singapore', region: 'Southeast Asia', csi: 30.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Thailand', region: 'Southeast Asia', csi: 52.0, incomeLevel: 'Upper-Middle', regionalHub: true },
  { country: 'Malaysia', region: 'Southeast Asia', csi: 46.0, incomeLevel: 'Upper-Middle', regionalHub: true },
  { country: 'Indonesia', region: 'Southeast Asia', csi: 56.0, incomeLevel: 'Upper-Middle', regionalHub: true },
  { country: 'Philippines', region: 'Southeast Asia', csi: 60.0, incomeLevel: 'Lower-Middle', regionalHub: true },
  { country: 'Vietnam', region: 'Southeast Asia', csi: 54.0, incomeLevel: 'Lower-Middle', regionalHub: true },
  { country: 'Myanmar', region: 'Southeast Asia', csi: 82.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Cambodia', region: 'Southeast Asia', csi: 64.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Laos', region: 'Southeast Asia', csi: 62.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Brunei', region: 'Southeast Asia', csi: 38.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Timor-Leste', region: 'Southeast Asia', csi: 66.0, incomeLevel: 'Lower-Middle', regionalHub: false },

  // South Asia (8 countries)
  { country: 'India', region: 'South Asia', csi: 55.0, incomeLevel: 'Lower-Middle', regionalHub: true },
  { country: 'Pakistan', region: 'South Asia', csi: 74.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Bangladesh', region: 'South Asia', csi: 62.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Sri Lanka', region: 'South Asia', csi: 66.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Nepal', region: 'South Asia', csi: 60.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Afghanistan', region: 'South Asia', csi: 95.0, incomeLevel: 'Low', regionalHub: false },
  { country: 'Bhutan', region: 'South Asia', csi: 48.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Maldives', region: 'South Asia', csi: 50.0, incomeLevel: 'Upper-Middle', regionalHub: false },

  // Oceania (15 countries)
  { country: 'Australia', region: 'Oceania', csi: 28.0, incomeLevel: 'High', regionalHub: true },
  { country: 'New Zealand', region: 'Oceania', csi: 26.0, incomeLevel: 'High', regionalHub: true },
  { country: 'Papua New Guinea', region: 'Oceania', csi: 68.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Fiji', region: 'Oceania', csi: 52.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Solomon Islands', region: 'Oceania', csi: 60.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Vanuatu', region: 'Oceania', csi: 54.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Samoa', region: 'Oceania', csi: 46.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Tonga', region: 'Oceania', csi: 48.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Micronesia', region: 'Oceania', csi: 50.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Palau', region: 'Oceania', csi: 42.0, incomeLevel: 'High', regionalHub: false },
  { country: 'Marshall Islands', region: 'Oceania', csi: 52.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Kiribati', region: 'Oceania', csi: 56.0, incomeLevel: 'Lower-Middle', regionalHub: false },
  { country: 'Nauru', region: 'Oceania', csi: 54.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Tuvalu', region: 'Oceania', csi: 58.0, incomeLevel: 'Upper-Middle', regionalHub: false },
  { country: 'Vatican City', region: 'Western Europe', csi: 22.0, incomeLevel: 'High', regionalHub: false }
];

// Initialize baselines and China silver event on first load
initializeBaselines();
initializeChinaSilverEvent();

/**
 * Get Country Shock Index (CSI) for a country
 * BACKWARD COMPATIBLE: Returns composite CSI (baseline + events)
 * 
 * @param countryName - Name of the country
 * @returns Composite CSI value (0-100)
 */
export const getCountryShockIndex = (countryName: string): number => {
  const composite = compositeCalculator.calculateCompositeCSI(countryName);
  return composite.composite_csi;
};

/**
 * Get detailed CSI breakdown (baseline + events)
 * NEW API: Provides full transparency into CSI composition
 * 
 * @param countryName - Name of the country
 * @returns CompositeCSI object with baseline, events, and metadata
 */
export const getCountryCSIDetails = (countryName: string): CompositeCSI => {
  return compositeCalculator.calculateCompositeCSI(countryName);
};

/**
 * Get country data by name
 */
export const getCountryData = (countryName: string): CountryRiskData | undefined => {
  return GLOBAL_COUNTRIES.find(
    c => c.country.toLowerCase() === countryName.toLowerCase()
  );
};

// Regional hub countries for supply chain analysis
export const REGIONAL_HUBS = GLOBAL_COUNTRIES.filter(c => c.regionalHub).map(c => c.country);

// Get countries by region
export const getCountriesByRegion = (region: string): CountryRiskData[] => {
  return GLOBAL_COUNTRIES.filter(c => c.region === region);
};

// Get countries by income level
export const getCountriesByIncomeLevel = (incomeLevel: string): CountryRiskData[] => {
  return GLOBAL_COUNTRIES.filter(c => c.incomeLevel === incomeLevel);
};

// Get regional hubs
export const getRegionalHubs = (): CountryRiskData[] => {
  return GLOBAL_COUNTRIES.filter(c => c.regionalHub);
};

// Get countries with CSI above threshold
export const getHighRiskCountries = (threshold: number = 70): CountryRiskData[] => {
  return GLOBAL_COUNTRIES.filter(c => c.csi >= threshold);
};

// Get countries with CSI below threshold
export const getLowRiskCountries = (threshold: number = 40): CountryRiskData[] => {
  return GLOBAL_COUNTRIES.filter(c => c.csi <= threshold);
};

// Get 7-vector data sources information
export const getVectorDataSources = () => VECTOR_DATA_SOURCES;

// Get vector weights
export const getVectorWeights = () => VECTOR_WEIGHTS;