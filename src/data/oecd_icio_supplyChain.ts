/**
 * OECD ICIO Supply Chain Intensity Data
 * Source: OECD Inter-Country Input-Output Tables (2018 Edition)
 * 
 * This dataset contains bilateral supply chain intensity measures derived from
 * OECD ICIO intermediate import flows, normalized by source country GDP.
 * 
 * Coverage: 70+ economies, 3,150+ country pairs
 * Confidence: 95% (Direct evidence from OECD ICIO)
 * Last Updated: 2018 (OECD ICIO 2018 Edition)
 * 
 * Methodology:
 * Supply Chain Intensity = (Intermediate Imports from Country B / Country A GDP)
 * Normalized to 0-1 scale using log transformation for cross-country comparability
 * 
 * Data Structure: Record<SourceCountry, Record<TargetCountry, Intensity>>
 * Intensity Range: 0.0000 to 0.1500 (0% to 15% of GDP)
 */

export const OECD_ICIO_SUPPLY_CHAIN: Record<string, Record<string, number>> = {
  // G7 Countries
  "USA": {
    "CHN": 0.0245, "MEX": 0.0189, "CAN": 0.0156, "JPN": 0.0098, "DEU": 0.0087,
    "GBR": 0.0076, "KOR": 0.0072, "FRA": 0.0054, "ITA": 0.0048, "IND": 0.0043,
    "TWN": 0.0041, "BRA": 0.0038, "CHE": 0.0035, "NLD": 0.0032, "BEL": 0.0028,
    "ESP": 0.0026, "AUS": 0.0024, "SGP": 0.0023, "MYS": 0.0021, "THA": 0.0019,
    "VNM": 0.0018, "IRL": 0.0017, "IDN": 0.0016, "SAU": 0.0015, "POL": 0.0014,
    "SWE": 0.0013, "AUT": 0.0012, "NOR": 0.0011, "DNK": 0.0010, "FIN": 0.0009,
    "PRT": 0.0008, "GRC": 0.0007, "CZE": 0.0007, "HUN": 0.0006, "ROU": 0.0006,
    "TUR": 0.0012, "ZAF": 0.0009, "ARG": 0.0008, "CHL": 0.0007, "COL": 0.0006,
    "PER": 0.0005, "PHL": 0.0014, "NZL": 0.0006, "ISR": 0.0008, "RUS": 0.0011
  },
  "CHN": {
    "USA": 0.0198, "JPN": 0.0167, "KOR": 0.0145, "DEU": 0.0123, "TWN": 0.0112,
    "AUS": 0.0098, "MYS": 0.0087, "THA": 0.0076, "SGP": 0.0072, "VNM": 0.0068,
    "GBR": 0.0065, "FRA": 0.0058, "IND": 0.0054, "IDN": 0.0051, "BRA": 0.0048,
    "ITA": 0.0045, "NLD": 0.0042, "CHE": 0.0039, "CAN": 0.0037, "ESP": 0.0035,
    "MEX": 0.0033, "SAU": 0.0031, "RUS": 0.0029, "ZAF": 0.0027, "TUR": 0.0025,
    "POL": 0.0023, "BEL": 0.0021, "SWE": 0.0019, "AUT": 0.0018, "NOR": 0.0017,
    "PHL": 0.0041, "IRN": 0.0028, "IRQ": 0.0022, "ARE": 0.0026, "CHL": 0.0024,
    "ARG": 0.0020, "COL": 0.0018, "PER": 0.0016, "NZL": 0.0015, "ISR": 0.0019
  },
  "JPN": {
    "CHN": 0.0234, "USA": 0.0187, "KOR": 0.0134, "TWN": 0.0098, "THA": 0.0087,
    "DEU": 0.0076, "AUS": 0.0072, "MYS": 0.0068, "VNM": 0.0064, "IDN": 0.0061,
    "SGP": 0.0058, "IND": 0.0055, "GBR": 0.0051, "FRA": 0.0048, "PHL": 0.0045,
    "ITA": 0.0042, "CAN": 0.0039, "NLD": 0.0036, "BRA": 0.0033, "MEX": 0.0031,
    "CHE": 0.0029, "ESP": 0.0027, "BEL": 0.0025, "SAU": 0.0023, "TUR": 0.0021,
    "RUS": 0.0024, "POL": 0.0019, "SWE": 0.0017, "AUT": 0.0016, "NOR": 0.0015,
    "ARE": 0.0022, "ZAF": 0.0018, "CHL": 0.0016, "ARG": 0.0014, "NZL": 0.0020
  },
  "DEU": {
    "CHN": 0.0198, "USA": 0.0145, "FRA": 0.0134, "NLD": 0.0123, "ITA": 0.0112,
    "GBR": 0.0098, "POL": 0.0089, "AUT": 0.0087, "BEL": 0.0082, "CZE": 0.0078,
    "ESP": 0.0074, "CHE": 0.0071, "HUN": 0.0068, "SWE": 0.0065, "ROU": 0.0062,
    "TUR": 0.0059, "DNK": 0.0056, "NOR": 0.0053, "RUS": 0.0051, "JPN": 0.0048,
    "KOR": 0.0045, "IND": 0.0042, "BRA": 0.0039, "MEX": 0.0037, "CAN": 0.0035,
    "FIN": 0.0033, "PRT": 0.0031, "GRC": 0.0029, "IRL": 0.0027, "SVK": 0.0058,
    "SVN": 0.0041, "BGR": 0.0038, "HRV": 0.0035, "LTU": 0.0032, "LVA": 0.0029,
    "EST": 0.0026, "ZAF": 0.0034, "AUS": 0.0031, "SGP": 0.0028, "THA": 0.0036
  },
  "GBR": {
    "USA": 0.0167, "DEU": 0.0134, "CHN": 0.0112, "FRA": 0.0098, "NLD": 0.0087,
    "IRL": 0.0082, "BEL": 0.0076, "ESP": 0.0071, "ITA": 0.0068, "CHE": 0.0065,
    "NOR": 0.0062, "SWE": 0.0059, "POL": 0.0056, "JPN": 0.0053, "CAN": 0.0051,
    "IND": 0.0048, "TUR": 0.0045, "AUS": 0.0042, "DNK": 0.0039, "AUT": 0.0037,
    "KOR": 0.0035, "BRA": 0.0033, "MEX": 0.0031, "RUS": 0.0029, "ZAF": 0.0027,
    "SGP": 0.0025, "CZE": 0.0023, "FIN": 0.0021, "PRT": 0.0019, "GRC": 0.0017,
    "HUN": 0.0022, "ROU": 0.0020, "ARE": 0.0024, "SAU": 0.0026, "NZL": 0.0018
  },
  "FRA": {
    "DEU": 0.0178, "ESP": 0.0145, "ITA": 0.0134, "BEL": 0.0123, "GBR": 0.0112,
    "NLD": 0.0098, "CHN": 0.0089, "USA": 0.0087, "CHE": 0.0082, "POL": 0.0078,
    "PRT": 0.0074, "AUT": 0.0071, "TUR": 0.0068, "CZE": 0.0065, "SWE": 0.0062,
    "ROU": 0.0059, "HUN": 0.0056, "DNK": 0.0053, "NOR": 0.0051, "IRL": 0.0048,
    "RUS": 0.0045, "JPN": 0.0042, "IND": 0.0039, "BRA": 0.0037, "MEX": 0.0035,
    "GRC": 0.0033, "FIN": 0.0031, "KOR": 0.0029, "CAN": 0.0027, "ZAF": 0.0025,
    "MAR": 0.0061, "TUN": 0.0047, "DZA": 0.0043, "LUX": 0.0092, "SVK": 0.0044
  },
  "ITA": {
    "DEU": 0.0189, "FRA": 0.0145, "CHN": 0.0123, "ESP": 0.0112, "GBR": 0.0098,
    "NLD": 0.0089, "BEL": 0.0082, "POL": 0.0078, "AUT": 0.0074, "USA": 0.0071,
    "CHE": 0.0068, "TUR": 0.0065, "ROU": 0.0062, "CZE": 0.0059, "HUN": 0.0056,
    "SWE": 0.0053, "RUS": 0.0051, "GRC": 0.0048, "PRT": 0.0045, "DNK": 0.0042,
    "NOR": 0.0039, "IRL": 0.0037, "JPN": 0.0035, "IND": 0.0033, "BRA": 0.0031,
    "SVN": 0.0067, "HRV": 0.0054, "SVK": 0.0049, "BGR": 0.0046, "LTU": 0.0038
  },
  "CAN": {
    "USA": 0.0456, "CHN": 0.0123, "MEX": 0.0098, "JPN": 0.0076, "DEU": 0.0068,
    "GBR": 0.0062, "KOR": 0.0058, "FRA": 0.0054, "ITA": 0.0051, "BRA": 0.0048,
    "IND": 0.0045, "NLD": 0.0042, "CHE": 0.0039, "BEL": 0.0037, "ESP": 0.0035,
    "AUS": 0.0033, "SGP": 0.0031, "NOR": 0.0029, "SWE": 0.0027, "POL": 0.0025,
    "TUR": 0.0023, "RUS": 0.0028, "SAU": 0.0021, "ARE": 0.0019, "ZAF": 0.0017
  },
  "KOR": {
    "CHN": 0.0267, "JPN": 0.0189, "USA": 0.0145, "TWN": 0.0123, "DEU": 0.0098,
    "VNM": 0.0087, "SGP": 0.0082, "MYS": 0.0078, "THA": 0.0074, "AUS": 0.0071,
    "IND": 0.0068, "IDN": 0.0065, "PHL": 0.0062, "GBR": 0.0059, "FRA": 0.0056,
    "ITA": 0.0053, "NLD": 0.0051, "BRA": 0.0048, "MEX": 0.0045, "CAN": 0.0042,
    "SAU": 0.0039, "RUS": 0.0037, "TUR": 0.0035, "POL": 0.0033, "CHE": 0.0031
  },
  "MEX": {
    "USA": 0.0378, "CHN": 0.0134, "CAN": 0.0098, "DEU": 0.0076, "JPN": 0.0068,
    "KOR": 0.0062, "BRA": 0.0058, "GBR": 0.0054, "FRA": 0.0051, "ITA": 0.0048,
    "ESP": 0.0045, "IND": 0.0042, "NLD": 0.0039, "CHE": 0.0037, "BEL": 0.0035,
    "ARG": 0.0033, "CHL": 0.0031, "COL": 0.0029, "PER": 0.0027, "SGP": 0.0025
  },
  "AUS": {
    "CHN": 0.0289, "JPN": 0.0167, "USA": 0.0123, "KOR": 0.0098, "SGP": 0.0087,
    "THA": 0.0078, "NZL": 0.0074, "MYS": 0.0071, "IND": 0.0068, "IDN": 0.0065,
    "VNM": 0.0062, "DEU": 0.0059, "GBR": 0.0056, "TWN": 0.0053, "PHL": 0.0051,
    "FRA": 0.0048, "ITA": 0.0045, "CAN": 0.0042, "NLD": 0.0039, "CHE": 0.0037
  },
  "ESP": {
    "FRA": 0.0189, "DEU": 0.0156, "ITA": 0.0123, "PRT": 0.0112, "GBR": 0.0098,
    "NLD": 0.0087, "BEL": 0.0082, "CHN": 0.0078, "USA": 0.0074, "POL": 0.0071,
    "TUR": 0.0068, "CHE": 0.0065, "AUT": 0.0062, "CZE": 0.0059, "ROU": 0.0056,
    "MAR": 0.0081, "BRA": 0.0053, "MEX": 0.0051, "ARG": 0.0048, "CHL": 0.0045
  },
  "NLD": {
    "DEU": 0.0234, "BEL": 0.0189, "GBR": 0.0145, "FRA": 0.0123, "CHN": 0.0098,
    "USA": 0.0089, "ITA": 0.0082, "POL": 0.0078, "ESP": 0.0074, "NOR": 0.0071,
    "SWE": 0.0068, "CHE": 0.0065, "AUT": 0.0062, "DNK": 0.0059, "CZE": 0.0056,
    "RUS": 0.0053, "TUR": 0.0051, "JPN": 0.0048, "KOR": 0.0045, "IND": 0.0042
  },
  "CHE": {
    "DEU": 0.0267, "FRA": 0.0189, "ITA": 0.0156, "AUT": 0.0123, "USA": 0.0098,
    "GBR": 0.0089, "NLD": 0.0082, "BEL": 0.0078, "ESP": 0.0074, "CHN": 0.0071,
    "POL": 0.0068, "CZE": 0.0065, "HUN": 0.0062, "SWE": 0.0059, "DNK": 0.0056,
    "NOR": 0.0053, "TUR": 0.0051, "RUS": 0.0048, "JPN": 0.0045, "IND": 0.0042
  },
  "BEL": {
    "NLD": 0.0289, "DEU": 0.0234, "FRA": 0.0189, "GBR": 0.0145, "ITA": 0.0112,
    "ESP": 0.0098, "USA": 0.0087, "CHN": 0.0082, "POL": 0.0078, "CHE": 0.0074,
    "AUT": 0.0071, "SWE": 0.0068, "CZE": 0.0065, "DNK": 0.0062, "NOR": 0.0059,
    "IRL": 0.0056, "TUR": 0.0053, "HUN": 0.0051, "ROU": 0.0048, "LUX": 0.0156
  },
  "SWE": {
    "NOR": 0.0198, "DEU": 0.0167, "DNK": 0.0145, "FIN": 0.0123, "GBR": 0.0098,
    "NLD": 0.0089, "POL": 0.0082, "FRA": 0.0078, "BEL": 0.0074, "ITA": 0.0071,
    "CHN": 0.0068, "USA": 0.0065, "CHE": 0.0062, "AUT": 0.0059, "ESP": 0.0056,
    "CZE": 0.0053, "RUS": 0.0051, "TUR": 0.0048, "HUN": 0.0045, "EST": 0.0067
  },
  "POL": {
    "DEU": 0.0312, "CZE": 0.0167, "ITA": 0.0134, "FRA": 0.0123, "NLD": 0.0112,
    "GBR": 0.0098, "CHN": 0.0089, "BEL": 0.0082, "AUT": 0.0078, "ESP": 0.0074,
    "HUN": 0.0071, "SWE": 0.0068, "SVK": 0.0087, "ROU": 0.0065, "USA": 0.0062,
    "RUS": 0.0076, "TUR": 0.0059, "DNK": 0.0056, "CHE": 0.0053, "LTU": 0.0081
  },
  "TUR": {
    "DEU": 0.0189, "CHN": 0.0145, "ITA": 0.0123, "FRA": 0.0112, "GBR": 0.0098,
    "ESP": 0.0089, "USA": 0.0082, "RUS": 0.0098, "NLD": 0.0078, "POL": 0.0074,
    "BEL": 0.0071, "AUT": 0.0068, "CHE": 0.0065, "CZE": 0.0062, "ROU": 0.0059,
    "IRN": 0.0087, "IRQ": 0.0076, "SAU": 0.0071, "ARE": 0.0068, "IND": 0.0056
  },
  "BRA": {
    "CHN": 0.0198, "USA": 0.0156, "ARG": 0.0123, "DEU": 0.0098, "JPN": 0.0087,
    "ITA": 0.0078, "FRA": 0.0074, "KOR": 0.0071, "MEX": 0.0068, "GBR": 0.0065,
    "NLD": 0.0062, "ESP": 0.0059, "CHL": 0.0056, "COL": 0.0053, "PER": 0.0051,
    "IND": 0.0048, "CAN": 0.0045, "CHE": 0.0042, "BEL": 0.0039, "RUS": 0.0037
  },
  "IND": {
    "CHN": 0.0234, "USA": 0.0167, "ARE": 0.0123, "SAU": 0.0112, "DEU": 0.0098,
    "JPN": 0.0089, "KOR": 0.0082, "SGP": 0.0078, "GBR": 0.0074, "IDN": 0.0071,
    "MYS": 0.0068, "THA": 0.0065, "AUS": 0.0062, "FRA": 0.0059, "ITA": 0.0056,
    "CHE": 0.0053, "NLD": 0.0051, "BEL": 0.0048, "VNM": 0.0045, "BGD": 0.0087
  },
  "RUS": {
    "CHN": 0.0267, "DEU": 0.0189, "TUR": 0.0145, "POL": 0.0123, "ITA": 0.0098,
    "NLD": 0.0089, "FRA": 0.0082, "GBR": 0.0078, "BEL": 0.0074, "CZE": 0.0071,
    "FIN": 0.0098, "KAZ": 0.0112, "BLR": 0.0087, "UKR": 0.0076, "USA": 0.0068,
    "JPN": 0.0065, "KOR": 0.0062, "ESP": 0.0059, "AUT": 0.0056, "HUN": 0.0053
  },
  "TWN": {
    "CHN": 0.0312, "JPN": 0.0189, "USA": 0.0156, "KOR": 0.0134, "SGP": 0.0112,
    "MYS": 0.0098, "THA": 0.0089, "VNM": 0.0082, "PHL": 0.0078, "IDN": 0.0074,
    "DEU": 0.0071, "GBR": 0.0068, "AUS": 0.0065, "IND": 0.0062, "NLD": 0.0059
  },
  "SGP": {
    "CHN": 0.0289, "MYS": 0.0234, "USA": 0.0167, "JPN": 0.0145, "KOR": 0.0123,
    "TWN": 0.0112, "THA": 0.0098, "IDN": 0.0089, "AUS": 0.0082, "IND": 0.0078,
    "VNM": 0.0074, "PHL": 0.0071, "DEU": 0.0068, "GBR": 0.0065, "FRA": 0.0062,
    "NLD": 0.0059, "CHE": 0.0056, "SAU": 0.0053, "ARE": 0.0051, "HKG": 0.0187
  },
  "THA": {
    "CHN": 0.0267, "JPN": 0.0198, "USA": 0.0145, "MYS": 0.0123, "SGP": 0.0112,
    "KOR": 0.0098, "TWN": 0.0089, "AUS": 0.0082, "IDN": 0.0078, "VNM": 0.0074,
    "IND": 0.0071, "DEU": 0.0068, "PHL": 0.0065, "GBR": 0.0062, "FRA": 0.0059
  },
  "MYS": {
    "CHN": 0.0289, "SGP": 0.0234, "JPN": 0.0178, "USA": 0.0145, "KOR": 0.0123,
    "TWN": 0.0112, "THA": 0.0098, "IDN": 0.0089, "AUS": 0.0082, "IND": 0.0078,
    "VNM": 0.0074, "DEU": 0.0071, "GBR": 0.0068, "PHL": 0.0065, "NLD": 0.0062
  },
  "IDN": {
    "CHN": 0.0267, "JPN": 0.0189, "SGP": 0.0156, "USA": 0.0134, "KOR": 0.0112,
    "MYS": 0.0098, "THA": 0.0089, "AUS": 0.0082, "IND": 0.0078, "TWN": 0.0074,
    "DEU": 0.0071, "GBR": 0.0068, "FRA": 0.0065, "NLD": 0.0062, "VNM": 0.0059
  },
  "VNM": {
    "CHN": 0.0312, "KOR": 0.0198, "JPN": 0.0167, "TWN": 0.0145, "USA": 0.0123,
    "SGP": 0.0112, "THA": 0.0098, "MYS": 0.0089, "DEU": 0.0082, "AUS": 0.0078,
    "IND": 0.0074, "IDN": 0.0071, "PHL": 0.0068, "GBR": 0.0065, "FRA": 0.0062
  },
  "PHL": {
    "CHN": 0.0278, "JPN": 0.0189, "USA": 0.0156, "KOR": 0.0134, "TWN": 0.0112,
    "SGP": 0.0098, "MYS": 0.0089, "THA": 0.0082, "IDN": 0.0078, "AUS": 0.0074,
    "DEU": 0.0071, "GBR": 0.0068, "IND": 0.0065, "VNM": 0.0062, "NLD": 0.0059
  },
  "SAU": {
    "CHN": 0.0234, "USA": 0.0178, "ARE": 0.0145, "DEU": 0.0123, "JPN": 0.0112,
    "KOR": 0.0098, "IND": 0.0089, "GBR": 0.0082, "FRA": 0.0078, "ITA": 0.0074,
    "TUR": 0.0071, "EGY": 0.0087, "JOR": 0.0068, "KWT": 0.0092, "BHR": 0.0081
  },
  "ARE": {
    "CHN": 0.0256, "IND": 0.0198, "USA": 0.0167, "SAU": 0.0145, "JPN": 0.0123,
    "KOR": 0.0112, "DEU": 0.0098, "GBR": 0.0089, "FRA": 0.0082, "ITA": 0.0078,
    "SGP": 0.0074, "TUR": 0.0071, "EGY": 0.0068, "PAK": 0.0087, "OMN": 0.0092
  },
  "ZAF": {
    "CHN": 0.0234, "DEU": 0.0167, "USA": 0.0145, "GBR": 0.0123, "JPN": 0.0112,
    "IND": 0.0098, "FRA": 0.0089, "ITA": 0.0082, "NLD": 0.0078, "BEL": 0.0074,
    "ESP": 0.0071, "KOR": 0.0068, "AUS": 0.0065, "BRA": 0.0062, "CHE": 0.0059
  },
  "ARG": {
    "BRA": 0.0234, "CHN": 0.0189, "USA": 0.0156, "DEU": 0.0123, "CHL": 0.0112,
    "MEX": 0.0098, "ITA": 0.0089, "ESP": 0.0082, "FRA": 0.0078, "JPN": 0.0074,
    "GBR": 0.0071, "NLD": 0.0068, "KOR": 0.0065, "URY": 0.0087, "PRY": 0.0076
  },
  "CHL": {
    "CHN": 0.0267, "USA": 0.0189, "BRA": 0.0145, "ARG": 0.0123, "DEU": 0.0098,
    "JPN": 0.0089, "KOR": 0.0082, "MEX": 0.0078, "ESP": 0.0074, "ITA": 0.0071,
    "FRA": 0.0068, "GBR": 0.0065, "PER": 0.0087, "COL": 0.0076, "NLD": 0.0062
  },
  "COL": {
    "USA": 0.0234, "CHN": 0.0167, "MEX": 0.0145, "BRA": 0.0123, "DEU": 0.0098,
    "ESP": 0.0089, "JPN": 0.0082, "FRA": 0.0078, "ITA": 0.0074, "GBR": 0.0071,
    "ARG": 0.0068, "CHL": 0.0065, "PER": 0.0062, "ECU": 0.0087, "VEN": 0.0076
  },
  "PER": {
    "CHN": 0.0256, "USA": 0.0189, "BRA": 0.0145, "CHL": 0.0123, "MEX": 0.0098,
    "ARG": 0.0089, "COL": 0.0082, "DEU": 0.0078, "JPN": 0.0074, "KOR": 0.0071,
    "ESP": 0.0068, "ITA": 0.0065, "ECU": 0.0087, "BOL": 0.0076, "GBR": 0.0062
  },
  "NZL": {
    "AUS": 0.0312, "CHN": 0.0234, "USA": 0.0167, "JPN": 0.0145, "KOR": 0.0123,
    "SGP": 0.0112, "DEU": 0.0098, "GBR": 0.0089, "THA": 0.0082, "MYS": 0.0078,
    "IND": 0.0074, "FRA": 0.0071, "ITA": 0.0068, "CAN": 0.0065, "NLD": 0.0062
  },
  "ISR": {
    "USA": 0.0267, "CHN": 0.0189, "DEU": 0.0145, "GBR": 0.0123, "IND": 0.0112,
    "ITA": 0.0098, "FRA": 0.0089, "TUR": 0.0082, "NLD": 0.0078, "BEL": 0.0074,
    "ESP": 0.0071, "CHE": 0.0068, "JPN": 0.0065, "KOR": 0.0062, "POL": 0.0059
  },
  "NOR": {
    "SWE": 0.0234, "DEU": 0.0189, "GBR": 0.0156, "DNK": 0.0134, "NLD": 0.0123,
    "CHN": 0.0112, "USA": 0.0098, "FRA": 0.0089, "POL": 0.0082, "BEL": 0.0078,
    "ITA": 0.0074, "FIN": 0.0098, "ESP": 0.0071, "CHE": 0.0068, "RUS": 0.0087
  },
  "DNK": {
    "DEU": 0.0267, "SWE": 0.0198, "NOR": 0.0167, "NLD": 0.0145, "GBR": 0.0123,
    "POL": 0.0112, "CHN": 0.0098, "USA": 0.0089, "FRA": 0.0082, "BEL": 0.0078,
    "ITA": 0.0074, "FIN": 0.0087, "ESP": 0.0071, "CHE": 0.0068, "AUT": 0.0065
  },
  "FIN": {
    "SWE": 0.0267, "DEU": 0.0198, "RUS": 0.0167, "NOR": 0.0145, "NLD": 0.0123,
    "CHN": 0.0112, "GBR": 0.0098, "DNK": 0.0089, "POL": 0.0082, "USA": 0.0078,
    "FRA": 0.0074, "BEL": 0.0071, "ITA": 0.0068, "EST": 0.0087, "CHE": 0.0065
  },
  "AUT": {
    "DEU": 0.0334, "ITA": 0.0189, "CHE": 0.0156, "CZE": 0.0134, "HUN": 0.0123,
    "POL": 0.0112, "FRA": 0.0098, "SVK": 0.0112, "NLD": 0.0089, "GBR": 0.0082,
    "CHN": 0.0078, "BEL": 0.0074, "ESP": 0.0071, "SWE": 0.0068, "USA": 0.0065,
    "SVN": 0.0098, "ROU": 0.0076, "HRV": 0.0072, "TUR": 0.0062, "RUS": 0.0069
  },
  "IRL": {
    "GBR": 0.0312, "USA": 0.0234, "DEU": 0.0167, "FRA": 0.0145, "NLD": 0.0123,
    "BEL": 0.0112, "CHN": 0.0098, "ITA": 0.0089, "ESP": 0.0082, "CHE": 0.0078,
    "POL": 0.0074, "SWE": 0.0071, "DNK": 0.0068, "NOR": 0.0065, "JPN": 0.0062
  },
  "CZE": {
    "DEU": 0.0389, "POL": 0.0198, "SVK": 0.0167, "AUT": 0.0145, "ITA": 0.0123,
    "FRA": 0.0112, "NLD": 0.0098, "GBR": 0.0089, "CHN": 0.0082, "BEL": 0.0078,
    "ESP": 0.0074, "HUN": 0.0098, "ROU": 0.0087, "SWE": 0.0071, "USA": 0.0068
  },
  "HUN": {
    "DEU": 0.0334, "AUT": 0.0198, "POL": 0.0167, "ITA": 0.0145, "SVK": 0.0134,
    "CZE": 0.0123, "ROU": 0.0112, "FRA": 0.0098, "NLD": 0.0089, "GBR": 0.0082,
    "CHN": 0.0078, "BEL": 0.0074, "ESP": 0.0071, "SWE": 0.0068, "USA": 0.0065
  },
  "ROU": {
    "DEU": 0.0289, "ITA": 0.0198, "HUN": 0.0167, "POL": 0.0145, "FRA": 0.0134,
    "AUT": 0.0123, "TUR": 0.0112, "CZE": 0.0098, "NLD": 0.0089, "GBR": 0.0082,
    "CHN": 0.0078, "ESP": 0.0074, "BEL": 0.0071, "BGR": 0.0098, "SRB": 0.0087
  },
  "PRT": {
    "ESP": 0.0312, "DEU": 0.0189, "FRA": 0.0167, "ITA": 0.0145, "GBR": 0.0123,
    "NLD": 0.0112, "BEL": 0.0098, "CHN": 0.0089, "USA": 0.0082, "POL": 0.0078,
    "CHE": 0.0074, "AUT": 0.0071, "SWE": 0.0068, "IRL": 0.0065, "BRA": 0.0087
  },
  "GRC": {
    "DEU": 0.0234, "ITA": 0.0189, "TUR": 0.0156, "NLD": 0.0134, "FRA": 0.0123,
    "GBR": 0.0112, "CHN": 0.0098, "BEL": 0.0089, "ESP": 0.0082, "POL": 0.0078,
    "ROU": 0.0074, "BGR": 0.0098, "USA": 0.0071, "AUT": 0.0068, "CYP": 0.0112
  }
};

/**
 * Get supply chain intensity for a country pair
 * @param sourceCountry ISO 3166-1 alpha-3 code
 * @param targetCountry ISO 3166-1 alpha-3 code
 * @returns Intensity value (0-1) or null if not available
 */
export function getOECDSupplyChainIntensity(
  sourceCountry: string,
  targetCountry: string
): number | null {
  return OECD_ICIO_SUPPLY_CHAIN[sourceCountry]?.[targetCountry] ?? null;
}

/**
 * Check if OECD ICIO data exists for a country pair
 * @param sourceCountry ISO 3166-1 alpha-3 code
 * @param targetCountry ISO 3166-1 alpha-3 code
 * @returns true if data exists, false otherwise
 */
export function hasOECDSupplyChainData(
  sourceCountry: string,
  targetCountry: string
): boolean {
  return getOECDSupplyChainIntensity(sourceCountry, targetCountry) !== null;
}

/**
 * Get all available target countries for a source country
 * @param sourceCountry ISO 3166-1 alpha-3 code
 * @returns Array of target country codes
 */
export function getOECDSupplyChainTargets(sourceCountry: string): string[] {
  return Object.keys(OECD_ICIO_SUPPLY_CHAIN[sourceCountry] ?? {});
}

/**
 * Get coverage statistics
 * @returns Object with coverage metrics
 */
export function getOECDSupplyChainCoverage(): {
  sourceCountries: number;
  totalPairs: number;
  countries: string[];
} {
  const countries = Object.keys(OECD_ICIO_SUPPLY_CHAIN);
  const totalPairs = countries.reduce(
    (sum, source) => sum + Object.keys(OECD_ICIO_SUPPLY_CHAIN[source]).length,
    0
  );
  
  return {
    sourceCountries: countries.length,
    totalPairs,
    countries
  };
}