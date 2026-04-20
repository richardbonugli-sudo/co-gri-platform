/**
 * Distance Matrix for Country Pairs
 * Source: CEPII GeoDist database + calculated distances
 * Metrics: Distance in km, common language, common region, trade agreements
 * 
 * Note: This is a comprehensive dataset covering major bilateral relationships.
 * For pairs not explicitly listed, use geographic approximation based on regional distances.
 */

import { DistanceMatrix, DistanceData } from './types';
import { countryGDPData } from './countryGDP';

/**
 * Distance matrix organized by country code pairs
 * Format: distanceMatrix[country1][country2] = { distance_km, common_language, common_region, trade_agreement }
 */
export const distanceMatrix: DistanceMatrix = {
  // United States relationships
  "US": {
    "CN": { distance_km: 11671, common_language: false, common_region: false, trade_agreement: null },
    "JP": { distance_km: 10870, common_language: false, common_region: false, trade_agreement: "US-Japan Trade Agreement" },
    "DE": { distance_km: 6385, common_language: false, common_region: false, trade_agreement: null },
    "GB": { distance_km: 5585, common_language: true, common_region: false, trade_agreement: null },
    "FR": { distance_km: 5837, common_language: false, common_region: false, trade_agreement: null },
    "IN": { distance_km: 12552, common_language: true, common_region: false, trade_agreement: null },
    "IT": { distance_km: 6895, common_language: false, common_region: false, trade_agreement: null },
    "BR": { distance_km: 7560, common_language: false, common_region: true, trade_agreement: null },
    "CA": { distance_km: 2262, common_language: true, common_region: true, trade_agreement: "USMCA" },
    "RU": { distance_km: 7826, common_language: false, common_region: false, trade_agreement: null },
    "KR": { distance_km: 11035, common_language: false, common_region: false, trade_agreement: "KORUS FTA" },
    "AU": { distance_km: 15362, common_language: true, common_region: false, trade_agreement: "AUSFTA" },
    "ES": { distance_km: 6207, common_language: false, common_region: false, trade_agreement: null },
    "MX": { distance_km: 1887, common_language: false, common_region: true, trade_agreement: "USMCA" },
    "ID": { distance_km: 14935, common_language: false, common_region: false, trade_agreement: null },
    "NL": { distance_km: 5869, common_language: false, common_region: false, trade_agreement: null },
    "SA": { distance_km: 11169, common_language: false, common_region: false, trade_agreement: null },
    "TR": { distance_km: 8683, common_language: false, common_region: false, trade_agreement: null },
    "CH": { distance_km: 6344, common_language: false, common_region: false, trade_agreement: null },
    "TW": { distance_km: 12077, common_language: false, common_region: false, trade_agreement: null },
    "PL": { distance_km: 7023, common_language: false, common_region: false, trade_agreement: null },
    "SE": { distance_km: 6705, common_language: false, common_region: false, trade_agreement: null },
    "BE": { distance_km: 5925, common_language: false, common_region: false, trade_agreement: null },
    "AR": { distance_km: 8374, common_language: false, common_region: true, trade_agreement: null },
    "NO": { distance_km: 6323, common_language: false, common_region: false, trade_agreement: null },
    "AT": { distance_km: 6751, common_language: false, common_region: false, trade_agreement: null },
    "AE": { distance_km: 11712, common_language: false, common_region: false, trade_agreement: null },
    "IE": { distance_km: 5283, common_language: true, common_region: false, trade_agreement: null },
    "IL": { distance_km: 9559, common_language: false, common_region: false, trade_agreement: "US-Israel FTA" },
    "TH": { distance_km: 13807, common_language: false, common_region: false, trade_agreement: null },
    "SG": { distance_km: 15346, common_language: true, common_region: false, trade_agreement: "US-Singapore FTA" },
    "MY": { distance_km: 15221, common_language: true, common_region: false, trade_agreement: null },
    "PH": { distance_km: 13232, common_language: true, common_region: false, trade_agreement: null },
    "VN": { distance_km: 13592, common_language: false, common_region: false, trade_agreement: null },
    "CL": { distance_km: 8294, common_language: false, common_region: true, trade_agreement: "US-Chile FTA" },
    "CO": { distance_km: 4012, common_language: false, common_region: true, trade_agreement: "US-Colombia TPA" },
    "PE": { distance_km: 6083, common_language: false, common_region: true, trade_agreement: "US-Peru TPA" },
    "NZ": { distance_km: 14213, common_language: true, common_region: false, trade_agreement: null },
    "HK": { distance_km: 12954, common_language: true, common_region: false, trade_agreement: null },
    "ZA": { distance_km: 12875, common_language: true, common_region: false, trade_agreement: null },
  },
  
  // China relationships
  "CN": {
    "US": { distance_km: 11671, common_language: false, common_region: false, trade_agreement: null },
    "JP": { distance_km: 2103, common_language: false, common_region: true, trade_agreement: null },
    "DE": { distance_km: 7365, common_language: false, common_region: false, trade_agreement: null },
    "GB": { distance_km: 8147, common_language: false, common_region: false, trade_agreement: null },
    "FR": { distance_km: 8213, common_language: false, common_region: false, trade_agreement: null },
    "IN": { distance_km: 3795, common_language: false, common_region: true, trade_agreement: null },
    "KR": { distance_km: 954, common_language: false, common_region: true, trade_agreement: null },
    "AU": { distance_km: 9016, common_language: false, common_region: false, trade_agreement: "China-Australia FTA" },
    "RU": { distance_km: 5794, common_language: false, common_region: true, trade_agreement: null },
    "BR": { distance_km: 17251, common_language: false, common_region: false, trade_agreement: null },
    "MX": { distance_km: 12963, common_language: false, common_region: false, trade_agreement: null },
    "ID": { distance_km: 4489, common_language: false, common_region: true, trade_agreement: null },
    "TW": { distance_km: 1816, common_language: true, common_region: true, trade_agreement: "ECFA" },
    "TH": { distance_km: 2561, common_language: false, common_region: true, trade_agreement: null },
    "SG": { distance_km: 4474, common_language: true, common_region: true, trade_agreement: "China-Singapore FTA" },
    "MY": { distance_km: 3796, common_language: true, common_region: true, trade_agreement: null },
    "VN": { distance_km: 2140, common_language: false, common_region: true, trade_agreement: null },
    "PH": { distance_km: 2827, common_language: false, common_region: true, trade_agreement: null },
    "HK": { distance_km: 1975, common_language: true, common_region: true, trade_agreement: "CEPA" },
    "PK": { distance_km: 4006, common_language: false, common_region: true, trade_agreement: "China-Pakistan FTA" },
    "SA": { distance_km: 5841, common_language: false, common_region: false, trade_agreement: null },
    "AE": { distance_km: 5954, common_language: false, common_region: false, trade_agreement: null },
    "NZ": { distance_km: 10755, common_language: false, common_region: false, trade_agreement: "China-New Zealand FTA" },
    "CL": { distance_km: 18722, common_language: false, common_region: false, trade_agreement: "China-Chile FTA" },
    "ZA": { distance_km: 11643, common_language: false, common_region: false, trade_agreement: null },
    "MM": { distance_km: 2397, common_language: false, common_region: true, trade_agreement: null },
    "KH": { distance_km: 2587, common_language: false, common_region: true, trade_agreement: null },
    "LA": { distance_km: 2095, common_language: false, common_region: true, trade_agreement: null },
  },
  
  // Japan relationships
  "JP": {
    "US": { distance_km: 10870, common_language: false, common_region: false, trade_agreement: "US-Japan Trade Agreement" },
    "CN": { distance_km: 2103, common_language: false, common_region: true, trade_agreement: null },
    "KR": { distance_km: 1157, common_language: false, common_region: true, trade_agreement: null },
    "DE": { distance_km: 8918, common_language: false, common_region: false, trade_agreement: null },
    "GB": { distance_km: 9584, common_language: false, common_region: false, trade_agreement: "Japan-UK EPA" },
    "IN": { distance_km: 5857, common_language: false, common_region: false, trade_agreement: "Japan-India EPA" },
    "AU": { distance_km: 7823, common_language: false, common_region: false, trade_agreement: "JAEPA" },
    "TW": { distance_km: 2103, common_language: false, common_region: true, trade_agreement: null },
    "TH": { distance_km: 4608, common_language: false, common_region: true, trade_agreement: "JTEPA" },
    "SG": { distance_km: 5312, common_language: false, common_region: true, trade_agreement: "JSEPA" },
    "MY": { distance_km: 5241, common_language: false, common_region: true, trade_agreement: "JMEPA" },
    "VN": { distance_km: 3762, common_language: false, common_region: true, trade_agreement: "JVEPA" },
    "PH": { distance_km: 3008, common_language: false, common_region: true, trade_agreement: "JPEPA" },
    "ID": { distance_km: 5791, common_language: false, common_region: true, trade_agreement: "JIEPA" },
    "RU": { distance_km: 7493, common_language: false, common_region: true, trade_agreement: null },
    "BR": { distance_km: 18545, common_language: false, common_region: false, trade_agreement: null },
    "MX": { distance_km: 11316, common_language: false, common_region: false, trade_agreement: "Japan-Mexico EPA" },
    "CH": { distance_km: 9571, common_language: false, common_region: false, trade_agreement: "Japan-Switzerland EPA" },
    "NZ": { distance_km: 9165, common_language: false, common_region: false, trade_agreement: null },
  },
  
  // Germany relationships
  "DE": {
    "US": { distance_km: 6385, common_language: false, common_region: false, trade_agreement: null },
    "CN": { distance_km: 7365, common_language: false, common_region: false, trade_agreement: null },
    "JP": { distance_km: 8918, common_language: false, common_region: false, trade_agreement: null },
    "GB": { distance_km: 932, common_language: false, common_region: true, trade_agreement: null },
    "FR": { distance_km: 878, common_language: false, common_region: true, trade_agreement: "EU" },
    "IT": { distance_km: 1184, common_language: false, common_region: true, trade_agreement: "EU" },
    "ES": { distance_km: 1871, common_language: false, common_region: true, trade_agreement: "EU" },
    "PL": { distance_km: 516, common_language: false, common_region: true, trade_agreement: "EU" },
    "NL": { distance_km: 576, common_language: false, common_region: true, trade_agreement: "EU" },
    "BE": { distance_km: 650, common_language: false, common_region: true, trade_agreement: "EU" },
    "AT": { distance_km: 524, common_language: true, common_region: true, trade_agreement: "EU" },
    "CH": { distance_km: 654, common_language: true, common_region: true, trade_agreement: null },
    "CZ": { distance_km: 280, common_language: false, common_region: true, trade_agreement: "EU" },
    "SE": { distance_km: 812, common_language: false, common_region: true, trade_agreement: "EU" },
    "DK": { distance_km: 358, common_language: false, common_region: true, trade_agreement: "EU" },
    "RU": { distance_km: 1609, common_language: false, common_region: false, trade_agreement: null },
    "TR": { distance_km: 2241, common_language: false, common_region: false, trade_agreement: null },
    "RO": { distance_km: 1293, common_language: false, common_region: true, trade_agreement: "EU" },
    "HU": { distance_km: 689, common_language: false, common_region: true, trade_agreement: "EU" },
    "NO": { distance_km: 1019, common_language: false, common_region: true, trade_agreement: null },
    "FI": { distance_km: 1545, common_language: false, common_region: true, trade_agreement: "EU" },
    "PT": { distance_km: 2313, common_language: false, common_region: true, trade_agreement: "EU" },
    "GR": { distance_km: 1804, common_language: false, common_region: true, trade_agreement: "EU" },
    "IE": { distance_km: 1315, common_language: false, common_region: true, trade_agreement: "EU" },
    "SK": { distance_km: 444, common_language: false, common_region: true, trade_agreement: "EU" },
    "BG": { distance_km: 1398, common_language: false, common_region: true, trade_agreement: "EU" },
    "HR": { distance_km: 764, common_language: false, common_region: true, trade_agreement: "EU" },
    "SI": { distance_km: 632, common_language: false, common_region: true, trade_agreement: "EU" },
    "LT": { distance_km: 1003, common_language: false, common_region: true, trade_agreement: "EU" },
    "LV": { distance_km: 1215, common_language: false, common_region: true, trade_agreement: "EU" },
    "EE": { distance_km: 1438, common_language: false, common_region: true, trade_agreement: "EU" },
  },
  
  // United Kingdom relationships
  "GB": {
    "US": { distance_km: 5585, common_language: true, common_region: false, trade_agreement: null },
    "CN": { distance_km: 8147, common_language: false, common_region: false, trade_agreement: null },
    "JP": { distance_km: 9584, common_language: false, common_region: false, trade_agreement: "Japan-UK EPA" },
    "DE": { distance_km: 932, common_language: false, common_region: true, trade_agreement: null },
    "FR": { distance_km: 344, common_language: false, common_region: true, trade_agreement: null },
    "IN": { distance_km: 6706, common_language: true, common_region: false, trade_agreement: null },
    "IE": { distance_km: 465, common_language: true, common_region: true, trade_agreement: null },
    "AU": { distance_km: 16997, common_language: true, common_region: false, trade_agreement: "UK-Australia FTA" },
    "CA": { distance_km: 5374, common_language: true, common_region: false, trade_agreement: "UK-Canada TCA" },
    "NZ": { distance_km: 18334, common_language: true, common_region: false, trade_agreement: "UK-New Zealand FTA" },
    "SG": { distance_km: 10871, common_language: true, common_region: false, trade_agreement: "UK-Singapore FTA" },
    "ZA": { distance_km: 9673, common_language: true, common_region: false, trade_agreement: null },
    "HK": { distance_km: 9648, common_language: true, common_region: false, trade_agreement: null },
  },
  
  // India relationships
  "IN": {
    "US": { distance_km: 12552, common_language: true, common_region: false, trade_agreement: null },
    "CN": { distance_km: 3795, common_language: false, common_region: true, trade_agreement: null },
    "JP": { distance_km: 5857, common_language: false, common_region: false, trade_agreement: "Japan-India EPA" },
    "GB": { distance_km: 6706, common_language: true, common_region: false, trade_agreement: null },
    "AE": { distance_km: 2999, common_language: false, common_region: false, trade_agreement: "India-UAE CEPA" },
    "SG": { distance_km: 4128, common_language: true, common_region: true, trade_agreement: "India-Singapore CECA" },
    "MY": { distance_km: 3889, common_language: true, common_region: true, trade_agreement: null },
    "AU": { distance_km: 8994, common_language: true, common_region: false, trade_agreement: "India-Australia ECTA" },
    "KR": { distance_km: 4646, common_language: false, common_region: true, trade_agreement: "India-Korea CEPA" },
    "TH": { distance_km: 2933, common_language: false, common_region: true, trade_agreement: null },
    "BD": { distance_km: 1881, common_language: false, common_region: true, trade_agreement: null },
    "PK": { distance_km: 1168, common_language: false, common_region: true, trade_agreement: null },
    "LK": { distance_km: 2209, common_language: false, common_region: true, trade_agreement: "India-Sri Lanka FTA" },
    "NP": { distance_km: 1008, common_language: false, common_region: true, trade_agreement: "India-Nepal Treaty of Trade" },
  },
  
  // ASEAN internal distances
  "SG": {
    "MY": { distance_km: 317, common_language: true, common_region: true, trade_agreement: "ASEAN" },
    "TH": { distance_km: 1436, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "ID": { distance_km: 890, common_language: true, common_region: true, trade_agreement: "ASEAN" },
    "VN": { distance_km: 1766, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "PH": { distance_km: 2398, common_language: true, common_region: true, trade_agreement: "ASEAN" },
    "MM": { distance_km: 2386, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "KH": { distance_km: 1090, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "LA": { distance_km: 1934, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "BN": { distance_km: 1214, common_language: true, common_region: true, trade_agreement: "ASEAN" },
    "CN": { distance_km: 4474, common_language: true, common_region: true, trade_agreement: "China-Singapore FTA" },
    "IN": { distance_km: 4128, common_language: true, common_region: true, trade_agreement: "India-Singapore CECA" },
    "JP": { distance_km: 5312, common_language: false, common_region: true, trade_agreement: "JSEPA" },
    "KR": { distance_km: 4659, common_language: false, common_region: true, trade_agreement: null },
    "AU": { distance_km: 6310, common_language: true, common_region: false, trade_agreement: "Singapore-Australia FTA" },
    "US": { distance_km: 15346, common_language: true, common_region: false, trade_agreement: "US-Singapore FTA" },
    "GB": { distance_km: 10871, common_language: true, common_region: false, trade_agreement: "UK-Singapore FTA" },
  },
  
  "MY": {
    "SG": { distance_km: 317, common_language: true, common_region: true, trade_agreement: "ASEAN" },
    "TH": { distance_km: 1191, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "ID": { distance_km: 1147, common_language: true, common_region: true, trade_agreement: "ASEAN" },
    "VN": { distance_km: 1504, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "PH": { distance_km: 2376, common_language: true, common_region: true, trade_agreement: "ASEAN" },
    "CN": { distance_km: 3796, common_language: true, common_region: true, trade_agreement: null },
    "JP": { distance_km: 5241, common_language: false, common_region: true, trade_agreement: "JMEPA" },
    "IN": { distance_km: 3889, common_language: true, common_region: true, trade_agreement: null },
    "AU": { distance_km: 5654, common_language: true, common_region: false, trade_agreement: "Malaysia-Australia FTA" },
  },
  
  "TH": {
    "MY": { distance_km: 1191, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "SG": { distance_km: 1436, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "VN": { distance_km: 1081, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "MM": { distance_km: 1093, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "LA": { distance_km: 628, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "KH": { distance_km: 618, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "CN": { distance_km: 2561, common_language: false, common_region: true, trade_agreement: null },
    "JP": { distance_km: 4608, common_language: false, common_region: true, trade_agreement: "JTEPA" },
    "IN": { distance_km: 2933, common_language: false, common_region: true, trade_agreement: null },
    "AU": { distance_km: 7407, common_language: false, common_region: false, trade_agreement: "Thailand-Australia FTA" },
  },
  
  "ID": {
    "MY": { distance_km: 1147, common_language: true, common_region: true, trade_agreement: "ASEAN" },
    "SG": { distance_km: 890, common_language: true, common_region: true, trade_agreement: "ASEAN" },
    "TH": { distance_km: 2321, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "PH": { distance_km: 2514, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "VN": { distance_km: 2356, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "AU": { distance_km: 3735, common_language: false, common_region: false, trade_agreement: "Indonesia-Australia CEPA" },
    "CN": { distance_km: 4489, common_language: false, common_region: true, trade_agreement: null },
    "JP": { distance_km: 5791, common_language: false, common_region: true, trade_agreement: "JIEPA" },
    "IN": { distance_km: 5142, common_language: false, common_region: true, trade_agreement: null },
  },
  
  "VN": {
    "CN": { distance_km: 2140, common_language: false, common_region: true, trade_agreement: null },
    "TH": { distance_km: 1081, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "MY": { distance_km: 1504, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "SG": { distance_km: 1766, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "KH": { distance_km: 497, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "LA": { distance_km: 553, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "JP": { distance_km: 3762, common_language: false, common_region: true, trade_agreement: "JVEPA" },
    "KR": { distance_km: 3289, common_language: false, common_region: true, trade_agreement: "Korea-Vietnam FTA" },
  },
  
  "PH": {
    "CN": { distance_km: 2827, common_language: false, common_region: true, trade_agreement: null },
    "JP": { distance_km: 3008, common_language: false, common_region: true, trade_agreement: "JPEPA" },
    "SG": { distance_km: 2398, common_language: true, common_region: true, trade_agreement: "ASEAN" },
    "MY": { distance_km: 2376, common_language: true, common_region: true, trade_agreement: "ASEAN" },
    "ID": { distance_km: 2514, common_language: false, common_region: true, trade_agreement: "ASEAN" },
    "TW": { distance_km: 1149, common_language: false, common_region: true, trade_agreement: null },
  },
  
  // EU internal distances (sample)
  "FR": {
    "DE": { distance_km: 878, common_language: false, common_region: true, trade_agreement: "EU" },
    "GB": { distance_km: 344, common_language: false, common_region: true, trade_agreement: null },
    "IT": { distance_km: 1105, common_language: false, common_region: true, trade_agreement: "EU" },
    "ES": { distance_km: 1053, common_language: false, common_region: true, trade_agreement: "EU" },
    "BE": { distance_km: 264, common_language: true, common_region: true, trade_agreement: "EU" },
    "NL": { distance_km: 430, common_language: false, common_region: true, trade_agreement: "EU" },
    "CH": { distance_km: 490, common_language: true, common_region: true, trade_agreement: null },
    "LU": { distance_km: 287, common_language: true, common_region: true, trade_agreement: "EU" },
    "PT": { distance_km: 1453, common_language: false, common_region: true, trade_agreement: "EU" },
  },
  
  "IT": {
    "DE": { distance_km: 1184, common_language: false, common_region: true, trade_agreement: "EU" },
    "FR": { distance_km: 1105, common_language: false, common_region: true, trade_agreement: "EU" },
    "ES": { distance_km: 1364, common_language: false, common_region: true, trade_agreement: "EU" },
    "CH": { distance_km: 686, common_language: true, common_region: true, trade_agreement: null },
    "AT": { distance_km: 764, common_language: false, common_region: true, trade_agreement: "EU" },
    "GR": { distance_km: 1314, common_language: false, common_region: true, trade_agreement: "EU" },
    "SI": { distance_km: 478, common_language: false, common_region: true, trade_agreement: "EU" },
  },
  
  "ES": {
    "FR": { distance_km: 1053, common_language: false, common_region: true, trade_agreement: "EU" },
    "PT": { distance_km: 502, common_language: false, common_region: true, trade_agreement: "EU" },
    "IT": { distance_km: 1364, common_language: false, common_region: true, trade_agreement: "EU" },
    "DE": { distance_km: 1871, common_language: false, common_region: true, trade_agreement: "EU" },
    "MX": { distance_km: 9204, common_language: true, common_region: false, trade_agreement: "EU-Mexico FTA" },
    "AR": { distance_km: 10073, common_language: true, common_region: false, trade_agreement: null },
    "CL": { distance_km: 11642, common_language: true, common_region: false, trade_agreement: "EU-Chile AA" },
  },
  
  // Americas
  "CA": {
    "US": { distance_km: 2262, common_language: true, common_region: true, trade_agreement: "USMCA" },
    "MX": { distance_km: 3218, common_language: false, common_region: true, trade_agreement: "USMCA" },
    "GB": { distance_km: 5374, common_language: true, common_region: false, trade_agreement: "UK-Canada TCA" },
    "CN": { distance_km: 10254, common_language: false, common_region: false, trade_agreement: null },
    "JP": { distance_km: 8316, common_language: false, common_region: false, trade_agreement: null },
  },
  
  "MX": {
    "US": { distance_km: 1887, common_language: false, common_region: true, trade_agreement: "USMCA" },
    "CA": { distance_km: 3218, common_language: false, common_region: true, trade_agreement: "USMCA" },
    "BR": { distance_km: 6766, common_language: false, common_region: true, trade_agreement: null },
    "AR": { distance_km: 7385, common_language: true, common_region: true, trade_agreement: null },
    "CL": { distance_km: 6908, common_language: true, common_region: true, trade_agreement: null },
    "CO": { distance_km: 3154, common_language: true, common_region: true, trade_agreement: null },
    "JP": { distance_km: 11316, common_language: false, common_region: false, trade_agreement: "Japan-Mexico EPA" },
    "ES": { distance_km: 9204, common_language: true, common_region: false, trade_agreement: "EU-Mexico FTA" },
  },
  
  "BR": {
    "AR": { distance_km: 1659, common_language: false, common_region: true, trade_agreement: "Mercosur" },
    "UY": { distance_km: 1817, common_language: false, common_region: true, trade_agreement: "Mercosur" },
    "PY": { distance_km: 1366, common_language: false, common_region: true, trade_agreement: "Mercosur" },
    "CL": { distance_km: 2893, common_language: false, common_region: true, trade_agreement: null },
    "CO": { distance_km: 3781, common_language: false, common_region: true, trade_agreement: null },
    "PE": { distance_km: 3138, common_language: false, common_region: true, trade_agreement: null },
    "US": { distance_km: 7560, common_language: false, common_region: true, trade_agreement: null },
    "CN": { distance_km: 17251, common_language: false, common_region: false, trade_agreement: null },
  },
  
  // Middle East
  "SA": {
    "AE": { distance_km: 867, common_language: true, common_region: true, trade_agreement: "GCC" },
    "QA": { distance_km: 442, common_language: true, common_region: true, trade_agreement: "GCC" },
    "KW": { distance_km: 546, common_language: true, common_region: true, trade_agreement: "GCC" },
    "OM": { distance_km: 1318, common_language: true, common_region: true, trade_agreement: "GCC" },
    "BH": { distance_km: 431, common_language: true, common_region: true, trade_agreement: "GCC" },
    "EG": { distance_km: 1643, common_language: true, common_region: true, trade_agreement: null },
    "IN": { distance_km: 3924, common_language: false, common_region: false, trade_agreement: null },
    "CN": { distance_km: 5841, common_language: false, common_region: false, trade_agreement: null },
  },
  
  "AE": {
    "SA": { distance_km: 867, common_language: true, common_region: true, trade_agreement: "GCC" },
    "IN": { distance_km: 2999, common_language: false, common_region: false, trade_agreement: "India-UAE CEPA" },
    "CN": { distance_km: 5954, common_language: false, common_region: false, trade_agreement: null },
    "GB": { distance_km: 5476, common_language: false, common_region: false, trade_agreement: null },
  },
  
  // Oceania
  "AU": {
    "NZ": { distance_km: 4155, common_language: true, common_region: true, trade_agreement: "ANZCERTA" },
    "CN": { distance_km: 9016, common_language: false, common_region: false, trade_agreement: "China-Australia FTA" },
    "JP": { distance_km: 7823, common_language: false, common_region: false, trade_agreement: "JAEPA" },
    "IN": { distance_km: 8994, common_language: true, common_region: false, trade_agreement: "India-Australia ECTA" },
    "US": { distance_km: 15362, common_language: true, common_region: false, trade_agreement: "AUSFTA" },
    "GB": { distance_km: 16997, common_language: true, common_region: false, trade_agreement: "UK-Australia FTA" },
    "SG": { distance_km: 6310, common_language: true, common_region: false, trade_agreement: "Singapore-Australia FTA" },
    "TH": { distance_km: 7407, common_language: false, common_region: false, trade_agreement: "Thailand-Australia FTA" },
    "ID": { distance_km: 3735, common_language: false, common_region: false, trade_agreement: "Indonesia-Australia CEPA" },
    "MY": { distance_km: 5654, common_language: true, common_region: false, trade_agreement: "Malaysia-Australia FTA" },
  },
  
  "NZ": {
    "AU": { distance_km: 4155, common_language: true, common_region: true, trade_agreement: "ANZCERTA" },
    "CN": { distance_km: 10755, common_language: false, common_region: false, trade_agreement: "China-New Zealand FTA" },
    "US": { distance_km: 14213, common_language: true, common_region: false, trade_agreement: null },
    "GB": { distance_km: 18334, common_language: true, common_region: false, trade_agreement: "UK-New Zealand FTA" },
    "SG": { distance_km: 8807, common_language: true, common_region: false, trade_agreement: null },
  },
  
  // Additional key pairs
  "KR": {
    "CN": { distance_km: 954, common_language: false, common_region: true, trade_agreement: null },
    "JP": { distance_km: 1157, common_language: false, common_region: true, trade_agreement: null },
    "US": { distance_km: 11035, common_language: false, common_region: false, trade_agreement: "KORUS FTA" },
    "IN": { distance_km: 4646, common_language: false, common_region: true, trade_agreement: "India-Korea CEPA" },
    "VN": { distance_km: 3289, common_language: false, common_region: true, trade_agreement: "Korea-Vietnam FTA" },
    "SG": { distance_km: 4659, common_language: false, common_region: true, trade_agreement: null },
    "AU": { distance_km: 8316, common_language: false, common_region: false, trade_agreement: "Korea-Australia FTA" },
  },
  
  "TW": {
    "CN": { distance_km: 1816, common_language: true, common_region: true, trade_agreement: "ECFA" },
    "JP": { distance_km: 2103, common_language: false, common_region: true, trade_agreement: null },
    "US": { distance_km: 12077, common_language: false, common_region: false, trade_agreement: null },
    "PH": { distance_km: 1149, common_language: false, common_region: true, trade_agreement: null },
    "SG": { distance_km: 3290, common_language: true, common_region: true, trade_agreement: null },
  },
  
  "RU": {
    "CN": { distance_km: 5794, common_language: false, common_region: true, trade_agreement: null },
    "DE": { distance_km: 1609, common_language: false, common_region: false, trade_agreement: null },
    "JP": { distance_km: 7493, common_language: false, common_region: true, trade_agreement: null },
    "US": { distance_km: 7826, common_language: false, common_region: false, trade_agreement: null },
    "TR": { distance_km: 1779, common_language: false, common_region: false, trade_agreement: null },
    "KZ": { distance_km: 3321, common_language: true, common_region: true, trade_agreement: "EAEU" },
    "BY": { distance_km: 679, common_language: true, common_region: true, trade_agreement: "EAEU" },
  },
  
  "TR": {
    "DE": { distance_km: 2241, common_language: false, common_region: false, trade_agreement: null },
    "RU": { distance_km: 1779, common_language: false, common_region: false, trade_agreement: null },
    "SA": { distance_km: 2406, common_language: false, common_region: false, trade_agreement: null },
    "US": { distance_km: 8683, common_language: false, common_region: false, trade_agreement: null },
    "GR": { distance_km: 1054, common_language: false, common_region: true, trade_agreement: null },
  },
  
  "ZA": {
    "GB": { distance_km: 9673, common_language: true, common_region: false, trade_agreement: null },
    "US": { distance_km: 12875, common_language: true, common_region: false, trade_agreement: null },
    "CN": { distance_km: 11643, common_language: false, common_region: false, trade_agreement: null },
    "IN": { distance_km: 7879, common_language: true, common_region: false, trade_agreement: null },
  },
};

/**
 * Convert country name to country code
 */
function getCountryCode(countryName: string): string | null {
  const country = countryGDPData.find(c => c.country.toLowerCase() === countryName.toLowerCase());
  return country?.country_code || null;
}

/**
 * Helper function to get distance between two countries (accepts names or codes)
 * Returns null if pair not found in matrix
 */
export function getDistance(country1: string, country2: string): number | null {
  // Convert names to codes if needed
  const code1 = country1.length === 2 ? country1 : getCountryCode(country1);
  const code2 = country2.length === 2 ? country2 : getCountryCode(country2);
  
  if (!code1 || !code2) {
    return null;
  }
  
  if (code1 === code2) {
    return 0;
  }
  
  // Try direct lookup
  if (distanceMatrix[code1]?.[code2]) {
    return distanceMatrix[code1][code2].distance_km;
  }
  
  // Try reverse lookup (matrix should be symmetric)
  if (distanceMatrix[code2]?.[code1]) {
    return distanceMatrix[code2][code1].distance_km;
  }
  
  return null;
}

/**
 * Get full distance data between two countries
 */
export function getDistanceData(country1: string, country2: string): DistanceData | null {
  // Convert names to codes if needed
  const code1 = country1.length === 2 ? country1 : getCountryCode(country1);
  const code2 = country2.length === 2 ? country2 : getCountryCode(country2);
  
  if (!code1 || !code2) {
    return null;
  }
  
  if (code1 === code2) {
    return { distance_km: 0, common_language: true, common_region: true, trade_agreement: null };
  }
  
  // Try direct lookup
  if (distanceMatrix[code1]?.[code2]) {
    return distanceMatrix[code1][code2];
  }
  
  // Try reverse lookup (matrix should be symmetric)
  if (distanceMatrix[code2]?.[code1]) {
    return distanceMatrix[code2][code1];
  }
  
  return null;
}

/**
 * Get all countries with distance data for a given country
 */
export function getCountryConnections(countryCode: string): string[] {
  const connections = new Set<string>();
  
  // Direct connections
  if (distanceMatrix[countryCode]) {
    Object.keys(distanceMatrix[countryCode]).forEach(c => connections.add(c));
  }
  
  // Reverse connections
  Object.keys(distanceMatrix).forEach(c1 => {
    if (distanceMatrix[c1][countryCode]) {
      connections.add(c1);
    }
  });
  
  return Array.from(connections);
}

/**
 * Check if two countries have a trade agreement
 */
export function hasTradeAgreement(country1: string, country2: string): boolean {
  const distance = getDistanceData(country1, country2);
  return distance?.trade_agreement !== null && distance?.trade_agreement !== undefined;
}

/**
 * Get regional neighbors (countries in same region with distance < 3000km)
 */
export function getRegionalNeighbors(countryCode: string): string[] {
  const neighbors: string[] = [];
  const connections = getCountryConnections(countryCode);
  
  connections.forEach(c => {
    const distance = getDistanceData(countryCode, c);
    if (distance && distance.common_region && distance.distance_km < 3000) {
      neighbors.push(c);
    }
  });
  
  return neighbors;
}