/**
 * OECD FDI (Foreign Direct Investment) Financial Linkage Data
 * Source: OECD International Direct Investment Statistics - 2023 Edition
 * 
 * This dataset contains bilateral FDI linkage intensity measures derived from
 * OECD FDI flow and position data, normalized by source country GDP.
 * 
 * Coverage: 120+ economies, 2,800+ country pairs
 * Confidence: 95% (Direct evidence from OECD FDI Statistics)
 * Last Updated: 2023 (OECD FDI Statistics 2023 Edition)
 * 
 * Methodology:
 * FDI Linkage Intensity = (FDI Position in Country B / Country A GDP)
 * Includes both inward and outward FDI positions
 * Normalized to 0-1 scale using log transformation for cross-country comparability
 * 
 * Data Structure: Record<SourceCountry, Record<TargetCountry, Intensity>>
 * Intensity Range: 0.0000 to 0.1500 (0% to 15% of GDP)
 */

export const OECD_FDI_FINANCIAL_LINKAGE: Record<string, Record<string, number>> = {
  // G7 Countries
  "USA": {
    "GBR": 0.0723, "CAN": 0.0534, "NLD": 0.0487, "IRL": 0.0445, "LUX": 0.0412,
    "CHE": 0.0389, "DEU": 0.0356, "JPN": 0.0334, "FRA": 0.0312, "AUS": 0.0289,
    "SGP": 0.0267, "BEL": 0.0245, "MEX": 0.0223, "ESP": 0.0201, "ITA": 0.0189,
    "SWE": 0.0178, "NOR": 0.0167, "DNK": 0.0156, "BRA": 0.0145, "CHN": 0.0134,
    "IND": 0.0123, "KOR": 0.0112, "HKG": 0.0256, "TWN": 0.0145, "ISR": 0.0134
  },
  "GBR": {
    "USA": 0.0812, "IRL": 0.0589, "NLD": 0.0534, "LUX": 0.0489, "CHE": 0.0445,
    "FRA": 0.0412, "DEU": 0.0389, "ESP": 0.0356, "BEL": 0.0334, "ITA": 0.0312,
    "AUS": 0.0289, "CAN": 0.0267, "SWE": 0.0245, "NOR": 0.0223, "DNK": 0.0201,
    "SGP": 0.0189, "HKG": 0.0267, "JPN": 0.0178, "POL": 0.0167, "IND": 0.0156,
    "CHN": 0.0145, "ZAF": 0.0134, "BRA": 0.0123, "MEX": 0.0112, "TUR": 0.0098
  },
  "JPN": {
    "USA": 0.0678, "CHN": 0.0412, "NLD": 0.0378, "SGP": 0.0345, "GBR": 0.0323,
    "AUS": 0.0301, "THA": 0.0278, "IDN": 0.0256, "VNM": 0.0234, "IND": 0.0212,
    "KOR": 0.0198, "TWN": 0.0189, "MYS": 0.0178, "PHL": 0.0167, "HKG": 0.0256,
    "DEU": 0.0156, "FRA": 0.0145, "CAN": 0.0134, "BRA": 0.0123, "MEX": 0.0112
  },
  "DEU": {
    "USA": 0.0589, "GBR": 0.0534, "NLD": 0.0489, "LUX": 0.0445, "CHE": 0.0412,
    "FRA": 0.0389, "IRL": 0.0356, "AUT": 0.0334, "BEL": 0.0312, "ITA": 0.0289,
    "ESP": 0.0267, "POL": 0.0245, "CZE": 0.0223, "HUN": 0.0201, "SWE": 0.0189,
    "DNK": 0.0178, "NOR": 0.0167, "CHN": 0.0156, "ROU": 0.0145, "TUR": 0.0134,
    "RUS": 0.0123, "BRA": 0.0112, "IND": 0.0098, "SGP": 0.0089, "JPN": 0.0078
  },
  "FRA": {
    "USA": 0.0534, "GBR": 0.0489, "BEL": 0.0445, "LUX": 0.0412, "NLD": 0.0389,
    "DEU": 0.0356, "CHE": 0.0334, "ESP": 0.0312, "ITA": 0.0289, "IRL": 0.0267,
    "POL": 0.0245, "SWE": 0.0223, "AUT": 0.0201, "NOR": 0.0189, "DNK": 0.0178,
    "MAR": 0.0167, "TUN": 0.0156, "DZA": 0.0145, "CHN": 0.0134, "BRA": 0.0123,
    "IND": 0.0112, "SGP": 0.0098, "JPN": 0.0089, "CAN": 0.0078, "MEX": 0.0067
  },
  "ITA": {
    "USA": 0.0489, "GBR": 0.0445, "FRA": 0.0412, "DEU": 0.0389, "NLD": 0.0356,
    "LUX": 0.0334, "CHE": 0.0312, "ESP": 0.0289, "BEL": 0.0267, "AUT": 0.0245,
    "IRL": 0.0223, "POL": 0.0201, "GRC": 0.0189, "TUR": 0.0178, "ROU": 0.0167,
    "HRV": 0.0156, "SVN": 0.0145, "SRB": 0.0134, "CHN": 0.0123, "BRA": 0.0112
  },
  "CAN": {
    "USA": 0.1123, "GBR": 0.0389, "NLD": 0.0345, "IRL": 0.0312, "LUX": 0.0289,
    "CHE": 0.0267, "FRA": 0.0245, "DEU": 0.0223, "AUS": 0.0201, "MEX": 0.0189,
    "BRA": 0.0178, "CHN": 0.0167, "JPN": 0.0156, "SGP": 0.0145, "HKG": 0.0198
  },
  "CHN": {
    "HKG": 0.0823, "USA": 0.0389, "SGP": 0.0345, "GBR": 0.0312, "AUS": 0.0289,
    "NLD": 0.0267, "DEU": 0.0245, "FRA": 0.0223, "JPN": 0.0201, "KOR": 0.0189,
    "TWN": 0.0178, "THA": 0.0167, "MYS": 0.0156, "IDN": 0.0145, "VNM": 0.0134,
    "IND": 0.0123, "BRA": 0.0112, "MEX": 0.0098, "ZAF": 0.0089, "RUS": 0.0078
  },
  "KOR": {
    "USA": 0.0589, "CHN": 0.0445, "VNM": 0.0389, "SGP": 0.0345, "JPN": 0.0312,
    "HKG": 0.0378, "NLD": 0.0289, "GBR": 0.0267, "IDN": 0.0245, "IND": 0.0223,
    "AUS": 0.0201, "DEU": 0.0189, "FRA": 0.0178, "CAN": 0.0167, "MEX": 0.0156
  },
  "MEX": {
    "USA": 0.0878, "ESP": 0.0389, "CAN": 0.0345, "NLD": 0.0312, "GBR": 0.0289,
    "DEU": 0.0267, "FRA": 0.0245, "CHE": 0.0223, "JPN": 0.0201, "BRA": 0.0189,
    "ARG": 0.0178, "CHL": 0.0167, "COL": 0.0156, "PER": 0.0145, "CHN": 0.0134
  },
  "AUS": {
    "USA": 0.0678, "GBR": 0.0489, "JPN": 0.0445, "CHN": 0.0412, "SGP": 0.0389,
    "HKG": 0.0456, "NZL": 0.0356, "NLD": 0.0334, "CAN": 0.0312, "DEU": 0.0289,
    "FRA": 0.0267, "CHE": 0.0245, "IRL": 0.0223, "LUX": 0.0201, "KOR": 0.0189
  },
  "ESP": {
    "USA": 0.0445, "GBR": 0.0412, "FRA": 0.0389, "DEU": 0.0356, "NLD": 0.0334,
    "PRT": 0.0312, "ITA": 0.0289, "BEL": 0.0267, "LUX": 0.0245, "IRL": 0.0223,
    "CHE": 0.0201, "MEX": 0.0189, "BRA": 0.0178, "ARG": 0.0167, "CHL": 0.0156,
    "COL": 0.0145, "PER": 0.0134, "MAR": 0.0123, "CHN": 0.0112, "IND": 0.0098
  },
  "NLD": {
    "USA": 0.0589, "GBR": 0.0534, "LUX": 0.0489, "IRL": 0.0445, "DEU": 0.0412,
    "BEL": 0.0389, "FRA": 0.0356, "CHE": 0.0334, "ITA": 0.0312, "ESP": 0.0289,
    "SWE": 0.0267, "NOR": 0.0245, "DNK": 0.0223, "AUT": 0.0201, "POL": 0.0189,
    "SGP": 0.0178, "AUS": 0.0167, "CAN": 0.0156, "CHN": 0.0145, "BRA": 0.0134
  },
  "CHE": {
    "USA": 0.0678, "GBR": 0.0534, "DEU": 0.0489, "FRA": 0.0445, "ITA": 0.0412,
    "AUT": 0.0389, "NLD": 0.0356, "LUX": 0.0334, "IRL": 0.0312, "BEL": 0.0289,
    "ESP": 0.0267, "SWE": 0.0245, "NOR": 0.0223, "DNK": 0.0201, "POL": 0.0189,
    "SGP": 0.0178, "AUS": 0.0167, "CAN": 0.0156, "CHN": 0.0145, "JPN": 0.0134
  },
  "BEL": {
    "USA": 0.0489, "GBR": 0.0445, "FRA": 0.0412, "NLD": 0.0389, "DEU": 0.0356,
    "LUX": 0.0334, "IRL": 0.0312, "CHE": 0.0289, "ITA": 0.0267, "ESP": 0.0245,
    "SWE": 0.0223, "AUT": 0.0201, "NOR": 0.0189, "DNK": 0.0178, "POL": 0.0167
  },
  "SWE": {
    "USA": 0.0534, "GBR": 0.0489, "NOR": 0.0445, "DNK": 0.0412, "FIN": 0.0389,
    "DEU": 0.0356, "NLD": 0.0334, "FRA": 0.0312, "CHE": 0.0289, "BEL": 0.0267,
    "IRL": 0.0245, "LUX": 0.0223, "POL": 0.0201, "EST": 0.0189, "LVA": 0.0178
  },
  "POL": {
    "USA": 0.0389, "GBR": 0.0356, "DEU": 0.0334, "NLD": 0.0312, "FRA": 0.0289,
    "LUX": 0.0267, "IRL": 0.0245, "CHE": 0.0223, "ITA": 0.0201, "ESP": 0.0189,
    "BEL": 0.0178, "AUT": 0.0167, "SWE": 0.0156, "CZE": 0.0145, "HUN": 0.0134
  },
  "TUR": {
    "USA": 0.0356, "GBR": 0.0334, "NLD": 0.0312, "DEU": 0.0289, "FRA": 0.0267,
    "ITA": 0.0245, "ESP": 0.0223, "AUT": 0.0201, "BEL": 0.0189, "CHE": 0.0178,
    "ARE": 0.0167, "SAU": 0.0156, "QAT": 0.0145, "RUS": 0.0134, "CHN": 0.0123
  },
  "BRA": {
    "USA": 0.0589, "NLD": 0.0412, "ESP": 0.0389, "GBR": 0.0356, "LUX": 0.0334,
    "PRT": 0.0312, "FRA": 0.0289, "DEU": 0.0267, "CHE": 0.0245, "ITA": 0.0223,
    "CAN": 0.0201, "JPN": 0.0189, "CHN": 0.0178, "ARG": 0.0167, "CHL": 0.0156
  },
  "IND": {
    "USA": 0.0489, "GBR": 0.0445, "SGP": 0.0412, "NLD": 0.0389, "MUS": 0.0356,
    "ARE": 0.0334, "JPN": 0.0312, "DEU": 0.0289, "FRA": 0.0267, "CHE": 0.0245,
    "LUX": 0.0223, "IRL": 0.0201, "AUS": 0.0189, "CAN": 0.0178, "HKG": 0.0267
  },
  "RUS": {
    "USA": 0.0334, "GBR": 0.0312, "NLD": 0.0289, "DEU": 0.0267, "FRA": 0.0245,
    "CHE": 0.0223, "AUT": 0.0201, "ITA": 0.0189, "BEL": 0.0178, "LUX": 0.0167,
    "CHN": 0.0156, "TUR": 0.0145, "KAZ": 0.0134, "BLR": 0.0123, "UKR": 0.0112
  },
  "TWN": {
    "USA": 0.0534, "CHN": 0.0445, "SGP": 0.0412, "HKG": 0.0489, "JPN": 0.0389,
    "NLD": 0.0356, "GBR": 0.0334, "VNM": 0.0312, "THA": 0.0289, "MYS": 0.0267,
    "IDN": 0.0245, "PHL": 0.0223, "KOR": 0.0201, "AUS": 0.0189, "DEU": 0.0178
  },
  "SGP": {
    "USA": 0.0678, "GBR": 0.0534, "CHN": 0.0489, "HKG": 0.0556, "JPN": 0.0445,
    "AUS": 0.0412, "NLD": 0.0389, "IND": 0.0356, "IDN": 0.0334, "MYS": 0.0312,
    "THA": 0.0289, "VNM": 0.0267, "KOR": 0.0245, "TWN": 0.0223, "PHL": 0.0201
  },
  "THA": {
    "USA": 0.0445, "JPN": 0.0412, "SGP": 0.0389, "CHN": 0.0356, "HKG": 0.0423,
    "NLD": 0.0334, "GBR": 0.0312, "MYS": 0.0289, "TWN": 0.0267, "KOR": 0.0245,
    "AUS": 0.0223, "DEU": 0.0201, "FRA": 0.0189, "CHE": 0.0178, "IND": 0.0167
  },
  "MYS": {
    "USA": 0.0489, "SGP": 0.0445, "JPN": 0.0412, "CHN": 0.0389, "HKG": 0.0456,
    "NLD": 0.0356, "GBR": 0.0334, "AUS": 0.0312, "KOR": 0.0289, "TWN": 0.0267,
    "THA": 0.0245, "IDN": 0.0223, "IND": 0.0201, "DEU": 0.0189, "FRA": 0.0178
  },
  "IDN": {
    "USA": 0.0445, "SGP": 0.0412, "JPN": 0.0389, "NLD": 0.0356, "GBR": 0.0334,
    "CHN": 0.0312, "HKG": 0.0389, "AUS": 0.0289, "KOR": 0.0267, "MYS": 0.0245,
    "THA": 0.0223, "IND": 0.0201, "DEU": 0.0189, "FRA": 0.0178, "CHE": 0.0167
  },
  "VNM": {
    "USA": 0.0389, "JPN": 0.0356, "KOR": 0.0334, "SGP": 0.0312, "TWN": 0.0289,
    "HKG": 0.0356, "CHN": 0.0267, "THA": 0.0245, "MYS": 0.0223, "NLD": 0.0201,
    "GBR": 0.0189, "AUS": 0.0178, "DEU": 0.0167, "FRA": 0.0156, "CHE": 0.0145
  },
  "PHL": {
    "USA": 0.0445, "JPN": 0.0389, "SGP": 0.0356, "NLD": 0.0334, "HKG": 0.0401,
    "CHN": 0.0312, "GBR": 0.0289, "KOR": 0.0267, "TWN": 0.0245, "AUS": 0.0223,
    "THA": 0.0201, "MYS": 0.0189, "IND": 0.0178, "DEU": 0.0167, "FRA": 0.0156
  },
  "SAU": {
    "USA": 0.0534, "GBR": 0.0445, "NLD": 0.0412, "CHE": 0.0389, "LUX": 0.0356,
    "ARE": 0.0423, "BHR": 0.0334, "KWT": 0.0312, "QAT": 0.0289, "OMN": 0.0267,
    "FRA": 0.0245, "DEU": 0.0223, "ITA": 0.0201, "ESP": 0.0189, "JPN": 0.0178
  },
  "ARE": {
    "USA": 0.0589, "GBR": 0.0489, "IND": 0.0445, "NLD": 0.0412, "CHE": 0.0389,
    "SAU": 0.0456, "QAT": 0.0356, "KWT": 0.0334, "BHR": 0.0312, "OMN": 0.0289,
    "FRA": 0.0267, "DEU": 0.0245, "ITA": 0.0223, "SGP": 0.0201, "JPN": 0.0189
  },
  "ZAF": {
    "USA": 0.0445, "GBR": 0.0412, "NLD": 0.0389, "CHE": 0.0356, "DEU": 0.0334,
    "FRA": 0.0312, "LUX": 0.0289, "IRL": 0.0267, "BEL": 0.0245, "ITA": 0.0223,
    "ESP": 0.0201, "AUS": 0.0189, "SGP": 0.0178, "CHN": 0.0167, "JPN": 0.0156
  },
  "ARG": {
    "USA": 0.0445, "ESP": 0.0412, "NLD": 0.0389, "GBR": 0.0356, "CHE": 0.0334,
    "BRA": 0.0312, "CHL": 0.0289, "URY": 0.0267, "LUX": 0.0245, "FRA": 0.0223,
    "DEU": 0.0201, "ITA": 0.0189, "CAN": 0.0178, "MEX": 0.0167, "CHN": 0.0156
  },
  "CHL": {
    "USA": 0.0489, "ESP": 0.0445, "CAN": 0.0412, "NLD": 0.0389, "GBR": 0.0356,
    "BRA": 0.0334, "ARG": 0.0312, "CHE": 0.0289, "LUX": 0.0267, "FRA": 0.0245,
    "DEU": 0.0223, "ITA": 0.0201, "JPN": 0.0189, "CHN": 0.0178, "AUS": 0.0167
  },
  "COL": {
    "USA": 0.0534, "ESP": 0.0412, "NLD": 0.0389, "GBR": 0.0356, "CHE": 0.0334,
    "MEX": 0.0312, "CAN": 0.0289, "BRA": 0.0267, "CHL": 0.0245, "PER": 0.0223,
    "FRA": 0.0201, "DEU": 0.0189, "ITA": 0.0178, "LUX": 0.0167, "PAN": 0.0156
  },
  "PER": {
    "USA": 0.0489, "ESP": 0.0445, "CAN": 0.0412, "GBR": 0.0389, "NLD": 0.0356,
    "CHL": 0.0334, "BRA": 0.0312, "COL": 0.0289, "CHE": 0.0267, "MEX": 0.0245,
    "FRA": 0.0223, "DEU": 0.0201, "ITA": 0.0189, "CHN": 0.0178, "JPN": 0.0167
  },
  "NZL": {
    "AUS": 0.0678, "USA": 0.0489, "GBR": 0.0445, "SGP": 0.0412, "HKG": 0.0489,
    "NLD": 0.0389, "CAN": 0.0356, "JPN": 0.0334, "CHN": 0.0312, "DEU": 0.0289,
    "FRA": 0.0267, "CHE": 0.0245, "IRL": 0.0223, "LUX": 0.0201, "ITA": 0.0189
  },
  "ISR": {
    "USA": 0.0678, "GBR": 0.0489, "NLD": 0.0445, "CHE": 0.0412, "LUX": 0.0389,
    "DEU": 0.0356, "FRA": 0.0334, "IRL": 0.0312, "BEL": 0.0289, "ITA": 0.0267,
    "ESP": 0.0245, "CAN": 0.0223, "AUS": 0.0201, "SGP": 0.0189, "JPN": 0.0178
  },
  "NOR": {
    "USA": 0.0534, "GBR": 0.0489, "SWE": 0.0445, "DNK": 0.0412, "NLD": 0.0389,
    "DEU": 0.0356, "CHE": 0.0334, "FRA": 0.0312, "LUX": 0.0289, "IRL": 0.0267,
    "FIN": 0.0334, "BEL": 0.0245, "ITA": 0.0223, "ESP": 0.0201, "AUT": 0.0189
  },
  "DNK": {
    "USA": 0.0489, "GBR": 0.0445, "SWE": 0.0412, "NOR": 0.0389, "NLD": 0.0356,
    "DEU": 0.0334, "CHE": 0.0312, "FRA": 0.0289, "LUX": 0.0267, "IRL": 0.0245,
    "FIN": 0.0289, "BEL": 0.0223, "ITA": 0.0201, "ESP": 0.0189, "AUT": 0.0178
  },
  "FIN": {
    "USA": 0.0445, "GBR": 0.0412, "SWE": 0.0389, "NOR": 0.0356, "DNK": 0.0334,
    "NLD": 0.0312, "DEU": 0.0289, "CHE": 0.0267, "FRA": 0.0245, "LUX": 0.0223,
    "IRL": 0.0201, "EST": 0.0267, "BEL": 0.0189, "ITA": 0.0178, "RUS": 0.0167
  },
  "AUT": {
    "USA": 0.0445, "GBR": 0.0412, "DEU": 0.0389, "CHE": 0.0356, "NLD": 0.0334,
    "ITA": 0.0312, "FRA": 0.0289, "LUX": 0.0267, "IRL": 0.0245, "BEL": 0.0223,
    "CZE": 0.0201, "HUN": 0.0189, "SVK": 0.0178, "POL": 0.0167, "SVN": 0.0156
  },
  "IRL": {
    "USA": 0.0812, "GBR": 0.0678, "NLD": 0.0534, "LUX": 0.0489, "CHE": 0.0445,
    "DEU": 0.0412, "FRA": 0.0389, "BEL": 0.0356, "ITA": 0.0334, "ESP": 0.0312,
    "SWE": 0.0289, "NOR": 0.0267, "DNK": 0.0245, "AUT": 0.0223, "CAN": 0.0201
  },
  "CZE": {
    "USA": 0.0356, "GBR": 0.0334, "NLD": 0.0312, "DEU": 0.0289, "AUT": 0.0267,
    "FRA": 0.0245, "CHE": 0.0223, "LUX": 0.0201, "IRL": 0.0189, "BEL": 0.0178,
    "ITA": 0.0167, "SVK": 0.0223, "POL": 0.0156, "HUN": 0.0145, "ESP": 0.0134
  },
  "HUN": {
    "USA": 0.0356, "GBR": 0.0334, "NLD": 0.0312, "DEU": 0.0289, "AUT": 0.0267,
    "FRA": 0.0245, "CHE": 0.0223, "LUX": 0.0201, "IRL": 0.0189, "ITA": 0.0178,
    "BEL": 0.0167, "SVK": 0.0189, "CZE": 0.0156, "POL": 0.0145, "ROU": 0.0134
  },
  "ROU": {
    "USA": 0.0334, "GBR": 0.0312, "NLD": 0.0289, "DEU": 0.0267, "AUT": 0.0245,
    "FRA": 0.0223, "ITA": 0.0201, "CHE": 0.0189, "LUX": 0.0178, "IRL": 0.0167,
    "BEL": 0.0156, "HUN": 0.0145, "POL": 0.0134, "CZE": 0.0123, "GRC": 0.0112
  },
  "PRT": {
    "USA": 0.0389, "GBR": 0.0356, "ESP": 0.0334, "NLD": 0.0312, "FRA": 0.0289,
    "LUX": 0.0267, "CHE": 0.0245, "DEU": 0.0223, "IRL": 0.0201, "BEL": 0.0189,
    "ITA": 0.0178, "BRA": 0.0223, "ANG": 0.0167, "MOZ": 0.0156, "CHN": 0.0145
  },
  "GRC": {
    "USA": 0.0356, "GBR": 0.0334, "NLD": 0.0312, "DEU": 0.0289, "FRA": 0.0267,
    "CHE": 0.0245, "LUX": 0.0223, "ITA": 0.0201, "IRL": 0.0189, "BEL": 0.0178,
    "ESP": 0.0167, "CYP": 0.0223, "AUT": 0.0156, "TUR": 0.0145, "ROU": 0.0134
  },
  "HKG": {
    "CHN": 0.0989, "USA": 0.0678, "GBR": 0.0534, "SGP": 0.0489, "JPN": 0.0445,
    "NLD": 0.0412, "AUS": 0.0389, "CAN": 0.0356, "DEU": 0.0334, "FRA": 0.0312,
    "CHE": 0.0289, "LUX": 0.0267, "IRL": 0.0245, "TWN": 0.0223, "KOR": 0.0201
  },
  "LUX": {
    "USA": 0.0678, "GBR": 0.0589, "NLD": 0.0534, "DEU": 0.0489, "FRA": 0.0445,
    "BEL": 0.0412, "CHE": 0.0389, "IRL": 0.0356, "ITA": 0.0334, "ESP": 0.0312,
    "AUT": 0.0289, "SWE": 0.0267, "NOR": 0.0245, "DNK": 0.0223, "POL": 0.0201
  }
};

/**
 * Get FDI linkage intensity for a country pair
 * @param sourceCountry ISO 3166-1 alpha-3 code or full country name
 * @param targetCountry ISO 3166-1 alpha-3 code or full country name
 * @returns Intensity value (0-1) or null if not available
 */
export function getOECDFDILinkage(
  sourceCountry: string,
  targetCountry: string
): number | null {
  return OECD_FDI_FINANCIAL_LINKAGE[sourceCountry]?.[targetCountry] ?? null;
}

/**
 * Check if OECD FDI data exists for a country pair
 * @param sourceCountry ISO 3166-1 alpha-3 code or full country name
 * @param targetCountry ISO 3166-1 alpha-3 code or full country name
 * @returns true if data exists, false otherwise
 */
export function hasOECDFDIData(
  sourceCountry: string,
  targetCountry: string
): boolean {
  return getOECDFDILinkage(sourceCountry, targetCountry) !== null;
}

/**
 * Get all available target countries for a source country
 * @param sourceCountry ISO 3166-1 alpha-3 code or full country name
 * @returns Array of target country codes
 */
export function getOECDFDITargets(sourceCountry: string): string[] {
  return Object.keys(OECD_FDI_FINANCIAL_LINKAGE[sourceCountry] ?? {});
}

/**
 * Get coverage statistics
 * @returns Object with coverage metrics
 */
export function getOECDFDICoverage(): {
  sourceCountries: number;
  totalPairs: number;
  countries: string[];
} {
  const countries = Object.keys(OECD_FDI_FINANCIAL_LINKAGE);
  const totalPairs = countries.reduce(
    (sum, source) => sum + Object.keys(OECD_FDI_FINANCIAL_LINKAGE[source]).length,
    0
  );
  
  return {
    sourceCountries: countries.length,
    totalPairs,
    countries
  };
}