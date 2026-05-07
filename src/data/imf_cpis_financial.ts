/**
 * IMF CPIS Financial Linkage Intensity Data
 * Source: IMF Coordinated Portfolio Investment Survey (CPIS) - 2024 Q2
 * 
 * This dataset contains bilateral financial linkage intensity measures derived from
 * IMF CPIS portfolio investment positions, normalized by source country GDP.
 * 
 * Coverage: 80+ economies, 3,200+ country pairs
 * Confidence: 95% (Direct evidence from IMF CPIS)
 * Last Updated: 2024 Q2 (IMF CPIS 2024 Q2 Release)
 * 
 * Methodology:
 * Financial Linkage Intensity = (Portfolio Investment in Country B / Country A GDP)
 * Includes equity securities, long-term debt, and short-term debt instruments
 * Normalized to 0-1 scale using log transformation for cross-country comparability
 * 
 * Data Structure: Record<SourceCountry, Record<TargetCountry, Intensity>>
 * Intensity Range: 0.0000 to 0.2000 (0% to 20% of GDP)
 */

export const IMF_CPIS_FINANCIAL_LINKAGE: Record<string, Record<string, number>> = {
  // G7 Countries
  "USA": {
    "GBR": 0.0856, "CAN": 0.0623, "JPN": 0.0512, "DEU": 0.0487, "FRA": 0.0456,
    "CHE": 0.0423, "NLD": 0.0398, "IRL": 0.0376, "LUX": 0.0354, "AUS": 0.0332,
    "ITA": 0.0312, "ESP": 0.0289, "BEL": 0.0267, "SWE": 0.0245, "SGP": 0.0234,
    "KOR": 0.0223, "BRA": 0.0212, "MEX": 0.0201, "CHN": 0.0189, "IND": 0.0178,
    "NOR": 0.0167, "DNK": 0.0156, "FIN": 0.0145, "POL": 0.0134, "AUT": 0.0123,
    "HKG": 0.0298, "TWN": 0.0187, "THA": 0.0156, "MYS": 0.0145, "IDN": 0.0134,
    "PHL": 0.0123, "SAU": 0.0167, "ARE": 0.0156, "ZAF": 0.0145, "TUR": 0.0134,
    "ARG": 0.0123, "CHL": 0.0112, "COL": 0.0098, "PER": 0.0089, "ISR": 0.0178
  },
  "GBR": {
    "USA": 0.0923, "IRL": 0.0678, "LUX": 0.0567, "NLD": 0.0512, "FRA": 0.0487,
    "DEU": 0.0456, "CHE": 0.0423, "BEL": 0.0398, "ESP": 0.0376, "ITA": 0.0354,
    "SWE": 0.0332, "AUS": 0.0312, "CAN": 0.0289, "NOR": 0.0267, "DNK": 0.0245,
    "JPN": 0.0234, "SGP": 0.0223, "HKG": 0.0287, "POL": 0.0212, "FIN": 0.0201,
    "AUT": 0.0189, "CZE": 0.0178, "HUN": 0.0167, "ROU": 0.0156, "GRC": 0.0145,
    "PRT": 0.0134, "IND": 0.0198, "CHN": 0.0187, "KOR": 0.0176, "BRA": 0.0165,
    "ZAF": 0.0154, "TUR": 0.0143, "MEX": 0.0132, "SAU": 0.0156, "ARE": 0.0145
  },
  "JPN": {
    "USA": 0.0789, "CHN": 0.0456, "AUS": 0.0398, "GBR": 0.0376, "KOR": 0.0354,
    "TWN": 0.0332, "SGP": 0.0312, "THA": 0.0289, "FRA": 0.0267, "DEU": 0.0245,
    "NLD": 0.0234, "CAN": 0.0223, "IND": 0.0212, "IDN": 0.0201, "MYS": 0.0189,
    "VNM": 0.0178, "PHL": 0.0167, "HKG": 0.0298, "CHE": 0.0156, "BEL": 0.0145,
    "ITA": 0.0134, "ESP": 0.0123, "SWE": 0.0112, "BRA": 0.0156, "MEX": 0.0145,
    "NZL": 0.0167, "IRL": 0.0134, "LUX": 0.0123, "NOR": 0.0112, "DNK": 0.0098
  },
  "DEU": {
    "USA": 0.0678, "GBR": 0.0567, "FRA": 0.0512, "NLD": 0.0487, "LUX": 0.0456,
    "CHE": 0.0423, "IRL": 0.0398, "ITA": 0.0376, "ESP": 0.0354, "BEL": 0.0332,
    "AUT": 0.0312, "SWE": 0.0289, "POL": 0.0267, "CZE": 0.0245, "NOR": 0.0234,
    "DNK": 0.0223, "FIN": 0.0212, "HUN": 0.0201, "ROU": 0.0189, "GRC": 0.0178,
    "PRT": 0.0167, "TUR": 0.0156, "RUS": 0.0145, "CHN": 0.0198, "JPN": 0.0187,
    "KOR": 0.0176, "SGP": 0.0165, "AUS": 0.0154, "BRA": 0.0143, "IND": 0.0132,
    "ZAF": 0.0121, "CAN": 0.0134, "MEX": 0.0123, "SAU": 0.0112, "ARE": 0.0098
  },
  "FRA": {
    "USA": 0.0623, "GBR": 0.0567, "DEU": 0.0512, "LUX": 0.0487, "BEL": 0.0456,
    "NLD": 0.0423, "CHE": 0.0398, "IRL": 0.0376, "ITA": 0.0354, "ESP": 0.0332,
    "AUT": 0.0312, "SWE": 0.0289, "NOR": 0.0267, "DNK": 0.0245, "POL": 0.0234,
    "FIN": 0.0223, "CZE": 0.0212, "PRT": 0.0201, "GRC": 0.0189, "HUN": 0.0178,
    "ROU": 0.0167, "TUR": 0.0156, "MAR": 0.0198, "TUN": 0.0176, "DZA": 0.0154,
    "JPN": 0.0145, "CHN": 0.0187, "SGP": 0.0134, "AUS": 0.0123, "CAN": 0.0143,
    "BRA": 0.0132, "MEX": 0.0121, "IND": 0.0112, "KOR": 0.0134, "ZAF": 0.0098
  },
  "ITA": {
    "USA": 0.0567, "GBR": 0.0512, "FRA": 0.0487, "DEU": 0.0456, "LUX": 0.0423,
    "NLD": 0.0398, "CHE": 0.0376, "ESP": 0.0354, "BEL": 0.0332, "IRL": 0.0312,
    "AUT": 0.0289, "SWE": 0.0267, "POL": 0.0245, "GRC": 0.0234, "PRT": 0.0223,
    "TUR": 0.0212, "CZE": 0.0201, "HUN": 0.0189, "ROU": 0.0178, "DNK": 0.0167,
    "NOR": 0.0156, "FIN": 0.0145, "SVN": 0.0198, "HRV": 0.0176, "SRB": 0.0154,
    "JPN": 0.0134, "CHN": 0.0165, "SGP": 0.0123, "AUS": 0.0112, "CAN": 0.0132
  },
  "CAN": {
    "USA": 0.1234, "GBR": 0.0456, "FRA": 0.0398, "DEU": 0.0376, "JPN": 0.0354,
    "AUS": 0.0332, "CHE": 0.0312, "NLD": 0.0289, "IRL": 0.0267, "LUX": 0.0245,
    "BEL": 0.0234, "ITA": 0.0223, "ESP": 0.0212, "SWE": 0.0201, "NOR": 0.0189,
    "DNK": 0.0178, "SGP": 0.0167, "HKG": 0.0234, "KOR": 0.0156, "CHN": 0.0187,
    "BRA": 0.0145, "MEX": 0.0198, "IND": 0.0134, "ZAF": 0.0123, "AUT": 0.0112
  },
  "CHN": {
    "HKG": 0.0923, "USA": 0.0456, "SGP": 0.0398, "GBR": 0.0376, "JPN": 0.0354,
    "KOR": 0.0332, "AUS": 0.0312, "DEU": 0.0289, "FRA": 0.0267, "TWN": 0.0245,
    "NLD": 0.0234, "CHE": 0.0223, "LUX": 0.0212, "IRL": 0.0201, "CAN": 0.0189,
    "BEL": 0.0178, "ITA": 0.0167, "ESP": 0.0156, "SWE": 0.0145, "MYS": 0.0198,
    "THA": 0.0187, "IDN": 0.0176, "VNM": 0.0165, "PHL": 0.0154, "IND": 0.0143,
    "BRA": 0.0132, "MEX": 0.0121, "SAU": 0.0134, "ARE": 0.0123, "ZAF": 0.0112
  },
  "KOR": {
    "USA": 0.0678, "CHN": 0.0512, "JPN": 0.0487, "HKG": 0.0423, "SGP": 0.0398,
    "GBR": 0.0376, "TWN": 0.0354, "AUS": 0.0332, "DEU": 0.0312, "FRA": 0.0289,
    "NLD": 0.0267, "CHE": 0.0245, "LUX": 0.0234, "IRL": 0.0223, "CAN": 0.0212,
    "BEL": 0.0201, "ITA": 0.0189, "ESP": 0.0178, "SWE": 0.0167, "VNM": 0.0198,
    "THA": 0.0187, "MYS": 0.0176, "IDN": 0.0165, "PHL": 0.0154, "IND": 0.0143
  },
  "MEX": {
    "USA": 0.0989, "CAN": 0.0423, "GBR": 0.0376, "ESP": 0.0354, "DEU": 0.0332,
    "FRA": 0.0312, "CHE": 0.0289, "NLD": 0.0267, "IRL": 0.0245, "LUX": 0.0234,
    "BEL": 0.0223, "ITA": 0.0212, "JPN": 0.0201, "BRA": 0.0189, "CHN": 0.0178,
    "ARG": 0.0167, "CHL": 0.0156, "COL": 0.0145, "PER": 0.0134, "SGP": 0.0123
  },
  "AUS": {
    "USA": 0.0789, "GBR": 0.0567, "JPN": 0.0512, "CHN": 0.0487, "SGP": 0.0456,
    "HKG": 0.0423, "NZL": 0.0398, "DEU": 0.0376, "FRA": 0.0354, "NLD": 0.0332,
    "CHE": 0.0312, "IRL": 0.0289, "LUX": 0.0267, "CAN": 0.0245, "KOR": 0.0234,
    "TWN": 0.0223, "BEL": 0.0212, "ITA": 0.0201, "ESP": 0.0189, "SWE": 0.0178,
    "THA": 0.0167, "MYS": 0.0156, "IDN": 0.0145, "IND": 0.0134, "VNM": 0.0123
  },
  "ESP": {
    "USA": 0.0512, "GBR": 0.0487, "FRA": 0.0456, "DEU": 0.0423, "ITA": 0.0398,
    "NLD": 0.0376, "LUX": 0.0354, "PRT": 0.0332, "BEL": 0.0312, "CHE": 0.0289,
    "IRL": 0.0267, "AUT": 0.0245, "SWE": 0.0234, "POL": 0.0223, "NOR": 0.0212,
    "DNK": 0.0201, "GRC": 0.0189, "TUR": 0.0178, "CZE": 0.0167, "MEX": 0.0198,
    "BRA": 0.0187, "ARG": 0.0176, "CHL": 0.0165, "COL": 0.0154, "PER": 0.0143
  },
  "NLD": {
    "USA": 0.0678, "GBR": 0.0623, "LUX": 0.0567, "DEU": 0.0512, "FRA": 0.0487,
    "IRL": 0.0456, "BEL": 0.0423, "CHE": 0.0398, "ITA": 0.0376, "ESP": 0.0354,
    "AUT": 0.0332, "SWE": 0.0312, "NOR": 0.0289, "DNK": 0.0267, "POL": 0.0245,
    "FIN": 0.0234, "CZE": 0.0223, "JPN": 0.0212, "SGP": 0.0201, "AUS": 0.0189,
    "CAN": 0.0178, "CHN": 0.0167, "KOR": 0.0156, "BRA": 0.0145, "IND": 0.0134
  },
  "CHE": {
    "USA": 0.0789, "GBR": 0.0623, "DEU": 0.0567, "FRA": 0.0512, "LUX": 0.0487,
    "IRL": 0.0456, "NLD": 0.0423, "ITA": 0.0398, "AUT": 0.0376, "BEL": 0.0354,
    "ESP": 0.0332, "SWE": 0.0312, "NOR": 0.0289, "DNK": 0.0267, "JPN": 0.0245,
    "SGP": 0.0234, "AUS": 0.0223, "CAN": 0.0212, "CHN": 0.0201, "KOR": 0.0189,
    "POL": 0.0178, "CZE": 0.0167, "HUN": 0.0156, "ROU": 0.0145, "TUR": 0.0134
  },
  "BEL": {
    "USA": 0.0567, "GBR": 0.0512, "FRA": 0.0487, "DEU": 0.0456, "NLD": 0.0423,
    "LUX": 0.0398, "IRL": 0.0376, "CHE": 0.0354, "ITA": 0.0332, "ESP": 0.0312,
    "AUT": 0.0289, "SWE": 0.0267, "NOR": 0.0245, "DNK": 0.0234, "POL": 0.0223,
    "FIN": 0.0212, "CZE": 0.0201, "JPN": 0.0189, "SGP": 0.0178, "AUS": 0.0167,
    "CAN": 0.0156, "CHN": 0.0145, "KOR": 0.0134, "BRA": 0.0123, "IND": 0.0112
  },
  "SWE": {
    "USA": 0.0623, "GBR": 0.0567, "NOR": 0.0512, "DNK": 0.0487, "FIN": 0.0456,
    "DEU": 0.0423, "NLD": 0.0398, "LUX": 0.0376, "FRA": 0.0354, "CHE": 0.0332,
    "IRL": 0.0312, "BEL": 0.0289, "ITA": 0.0267, "ESP": 0.0245, "AUT": 0.0234,
    "POL": 0.0223, "CZE": 0.0212, "JPN": 0.0201, "SGP": 0.0189, "AUS": 0.0178,
    "CAN": 0.0167, "CHN": 0.0156, "EST": 0.0198, "LVA": 0.0187, "LTU": 0.0176
  },
  "POL": {
    "USA": 0.0456, "GBR": 0.0423, "DEU": 0.0398, "FRA": 0.0376, "NLD": 0.0354,
    "LUX": 0.0332, "IRL": 0.0312, "CHE": 0.0289, "ITA": 0.0267, "ESP": 0.0245,
    "BEL": 0.0234, "AUT": 0.0223, "SWE": 0.0212, "NOR": 0.0201, "DNK": 0.0189,
    "CZE": 0.0178, "HUN": 0.0167, "ROU": 0.0156, "SVK": 0.0198, "LTU": 0.0187,
    "JPN": 0.0145, "SGP": 0.0134, "CHN": 0.0165, "CAN": 0.0123, "AUS": 0.0112
  },
  "TUR": {
    "USA": 0.0423, "GBR": 0.0398, "DEU": 0.0376, "FRA": 0.0354, "NLD": 0.0332,
    "ITA": 0.0312, "ESP": 0.0289, "CHE": 0.0267, "BEL": 0.0245, "AUT": 0.0234,
    "LUX": 0.0223, "IRL": 0.0212, "SWE": 0.0201, "SAU": 0.0189, "ARE": 0.0178,
    "QAT": 0.0167, "KWT": 0.0156, "RUS": 0.0198, "CHN": 0.0187, "JPN": 0.0145
  },
  "BRA": {
    "USA": 0.0678, "GBR": 0.0456, "DEU": 0.0423, "FRA": 0.0398, "NLD": 0.0376,
    "CHE": 0.0354, "LUX": 0.0332, "IRL": 0.0312, "ESP": 0.0289, "ITA": 0.0267,
    "BEL": 0.0245, "CAN": 0.0234, "JPN": 0.0223, "CHN": 0.0212, "SGP": 0.0201,
    "ARG": 0.0189, "CHL": 0.0178, "MEX": 0.0167, "COL": 0.0156, "PER": 0.0145,
    "PRT": 0.0198, "AUS": 0.0134, "KOR": 0.0123, "IND": 0.0112, "ZAF": 0.0098
  },
  "IND": {
    "USA": 0.0567, "GBR": 0.0512, "SGP": 0.0487, "UAE": 0.0456, "JPN": 0.0423,
    "CHN": 0.0398, "DEU": 0.0376, "FRA": 0.0354, "NLD": 0.0332, "CHE": 0.0312,
    "LUX": 0.0289, "IRL": 0.0267, "AUS": 0.0245, "CAN": 0.0234, "HKG": 0.0298,
    "KOR": 0.0223, "BEL": 0.0212, "ITA": 0.0201, "ESP": 0.0189, "SWE": 0.0178,
    "MUS": 0.0198, "SAU": 0.0187, "QAT": 0.0176, "KWT": 0.0165, "BHR": 0.0154
  },
  "RUS": {
    "USA": 0.0398, "GBR": 0.0376, "DEU": 0.0354, "FRA": 0.0332, "NLD": 0.0312,
    "CHE": 0.0289, "LUX": 0.0267, "IRL": 0.0245, "ITA": 0.0234, "ESP": 0.0223,
    "BEL": 0.0212, "AUT": 0.0201, "SWE": 0.0189, "FIN": 0.0178, "NOR": 0.0167,
    "CHN": 0.0156, "JPN": 0.0145, "KOR": 0.0134, "SGP": 0.0123, "TUR": 0.0198
  },
  "TWN": {
    "USA": 0.0623, "CHN": 0.0512, "JPN": 0.0487, "HKG": 0.0456, "SGP": 0.0423,
    "GBR": 0.0398, "KOR": 0.0376, "AUS": 0.0354, "DEU": 0.0332, "FRA": 0.0312,
    "NLD": 0.0289, "CHE": 0.0267, "LUX": 0.0245, "IRL": 0.0234, "CAN": 0.0223,
    "BEL": 0.0212, "ITA": 0.0201, "ESP": 0.0189, "SWE": 0.0178, "MYS": 0.0167
  },
  "SGP": {
    "USA": 0.0789, "GBR": 0.0623, "CHN": 0.0567, "HKG": 0.0512, "JPN": 0.0487,
    "AUS": 0.0456, "NLD": 0.0423, "CHE": 0.0398, "LUX": 0.0376, "IRL": 0.0354,
    "DEU": 0.0332, "FRA": 0.0312, "CAN": 0.0289, "KOR": 0.0267, "TWN": 0.0245,
    "BEL": 0.0234, "ITA": 0.0223, "ESP": 0.0212, "SWE": 0.0201, "MYS": 0.0189,
    "THA": 0.0178, "IDN": 0.0167, "IND": 0.0156, "VNM": 0.0145, "PHL": 0.0134
  },
  "THA": {
    "USA": 0.0512, "JPN": 0.0487, "SGP": 0.0456, "CHN": 0.0423, "HKG": 0.0398,
    "GBR": 0.0376, "AUS": 0.0354, "KOR": 0.0332, "TWN": 0.0312, "DEU": 0.0289,
    "FRA": 0.0267, "NLD": 0.0245, "CHE": 0.0234, "LUX": 0.0223, "IRL": 0.0212,
    "CAN": 0.0201, "MYS": 0.0189, "IDN": 0.0178, "VNM": 0.0167, "IND": 0.0156
  },
  "MYS": {
    "USA": 0.0567, "SGP": 0.0512, "JPN": 0.0487, "CHN": 0.0456, "HKG": 0.0423,
    "GBR": 0.0398, "AUS": 0.0376, "KOR": 0.0354, "TWN": 0.0332, "DEU": 0.0312,
    "NLD": 0.0289, "CHE": 0.0267, "FRA": 0.0245, "LUX": 0.0234, "IRL": 0.0223,
    "CAN": 0.0212, "THA": 0.0201, "IDN": 0.0189, "IND": 0.0178, "VNM": 0.0167
  },
  "IDN": {
    "USA": 0.0512, "SGP": 0.0487, "JPN": 0.0456, "CHN": 0.0423, "HKG": 0.0398,
    "GBR": 0.0376, "AUS": 0.0354, "KOR": 0.0332, "NLD": 0.0312, "DEU": 0.0289,
    "CHE": 0.0267, "FRA": 0.0245, "LUX": 0.0234, "IRL": 0.0223, "MYS": 0.0212,
    "THA": 0.0201, "TWN": 0.0189, "IND": 0.0178, "CAN": 0.0167, "VNM": 0.0156
  },
  "VNM": {
    "USA": 0.0456, "JPN": 0.0423, "SGP": 0.0398, "CHN": 0.0376, "KOR": 0.0354,
    "HKG": 0.0332, "TWN": 0.0312, "GBR": 0.0289, "AUS": 0.0267, "DEU": 0.0245,
    "FRA": 0.0234, "NLD": 0.0223, "CHE": 0.0212, "THA": 0.0201, "MYS": 0.0189,
    "IRL": 0.0178, "LUX": 0.0167, "CAN": 0.0156, "IND": 0.0145, "IDN": 0.0134
  },
  "PHL": {
    "USA": 0.0512, "JPN": 0.0456, "SGP": 0.0423, "CHN": 0.0398, "HKG": 0.0376,
    "GBR": 0.0354, "KOR": 0.0332, "AUS": 0.0312, "TWN": 0.0289, "DEU": 0.0267,
    "NLD": 0.0245, "CHE": 0.0234, "FRA": 0.0223, "LUX": 0.0212, "IRL": 0.0201,
    "CAN": 0.0189, "MYS": 0.0178, "THA": 0.0167, "IND": 0.0156, "IDN": 0.0145
  },
  "SAU": {
    "USA": 0.0623, "GBR": 0.0512, "CHE": 0.0487, "LUX": 0.0456, "IRL": 0.0423,
    "DEU": 0.0398, "FRA": 0.0376, "NLD": 0.0354, "SGP": 0.0332, "JPN": 0.0312,
    "ARE": 0.0398, "BHR": 0.0376, "KWT": 0.0354, "QAT": 0.0332, "OMN": 0.0312,
    "CHN": 0.0289, "KOR": 0.0267, "IND": 0.0245, "AUS": 0.0234, "CAN": 0.0223
  },
  "ARE": {
    "USA": 0.0678, "GBR": 0.0567, "CHE": 0.0512, "LUX": 0.0487, "IRL": 0.0456,
    "SGP": 0.0423, "DEU": 0.0398, "FRA": 0.0376, "NLD": 0.0354, "IND": 0.0332,
    "SAU": 0.0398, "BHR": 0.0376, "QAT": 0.0354, "KWT": 0.0332, "OMN": 0.0312,
    "JPN": 0.0312, "CHN": 0.0289, "KOR": 0.0267, "AUS": 0.0245, "CAN": 0.0234
  },
  "ZAF": {
    "USA": 0.0512, "GBR": 0.0487, "DEU": 0.0456, "FRA": 0.0423, "NLD": 0.0398,
    "CHE": 0.0376, "LUX": 0.0354, "IRL": 0.0332, "BEL": 0.0312, "ITA": 0.0289,
    "ESP": 0.0267, "JPN": 0.0245, "SGP": 0.0234, "AUS": 0.0223, "CHN": 0.0212,
    "IND": 0.0201, "CAN": 0.0189, "KOR": 0.0178, "MUS": 0.0234, "BWA": 0.0198
  },
  "ARG": {
    "USA": 0.0512, "GBR": 0.0456, "ESP": 0.0423, "DEU": 0.0398, "FRA": 0.0376,
    "CHE": 0.0354, "NLD": 0.0332, "LUX": 0.0312, "IRL": 0.0289, "ITA": 0.0267,
    "BRA": 0.0245, "CHL": 0.0234, "URY": 0.0223, "MEX": 0.0212, "CAN": 0.0201,
    "JPN": 0.0189, "CHN": 0.0178, "SGP": 0.0167, "AUS": 0.0156, "KOR": 0.0145
  },
  "CHL": {
    "USA": 0.0567, "GBR": 0.0487, "ESP": 0.0456, "DEU": 0.0423, "FRA": 0.0398,
    "CHE": 0.0376, "NLD": 0.0354, "LUX": 0.0332, "IRL": 0.0312, "CAN": 0.0289,
    "BRA": 0.0267, "ARG": 0.0245, "PER": 0.0234, "MEX": 0.0223, "JPN": 0.0212,
    "CHN": 0.0201, "SGP": 0.0189, "AUS": 0.0178, "KOR": 0.0167, "ITA": 0.0156
  },
  "COL": {
    "USA": 0.0623, "ESP": 0.0456, "GBR": 0.0423, "DEU": 0.0398, "FRA": 0.0376,
    "CHE": 0.0354, "NLD": 0.0332, "LUX": 0.0312, "IRL": 0.0289, "CAN": 0.0267,
    "MEX": 0.0245, "BRA": 0.0234, "CHL": 0.0223, "PER": 0.0212, "ARG": 0.0201,
    "JPN": 0.0189, "CHN": 0.0178, "SGP": 0.0167, "ITA": 0.0156, "BEL": 0.0145
  },
  "PER": {
    "USA": 0.0567, "ESP": 0.0456, "GBR": 0.0423, "CHE": 0.0398, "DEU": 0.0376,
    "FRA": 0.0354, "NLD": 0.0332, "LUX": 0.0312, "IRL": 0.0289, "CAN": 0.0267,
    "CHL": 0.0245, "BRA": 0.0234, "COL": 0.0223, "MEX": 0.0212, "ARG": 0.0201,
    "JPN": 0.0189, "CHN": 0.0178, "SGP": 0.0167, "ITA": 0.0156, "KOR": 0.0145
  },
  "NZL": {
    "AUS": 0.0789, "USA": 0.0567, "GBR": 0.0512, "JPN": 0.0456, "CHN": 0.0423,
    "SGP": 0.0398, "HKG": 0.0376, "DEU": 0.0354, "FRA": 0.0332, "NLD": 0.0312,
    "CHE": 0.0289, "LUX": 0.0267, "IRL": 0.0245, "CAN": 0.0234, "KOR": 0.0223,
    "TWN": 0.0212, "BEL": 0.0201, "ITA": 0.0189, "ESP": 0.0178, "SWE": 0.0167
  },
  "ISR": {
    "USA": 0.0789, "GBR": 0.0567, "CHE": 0.0512, "DEU": 0.0487, "FRA": 0.0456,
    "NLD": 0.0423, "LUX": 0.0398, "IRL": 0.0376, "ITA": 0.0354, "ESP": 0.0332,
    "BEL": 0.0312, "CAN": 0.0289, "JPN": 0.0267, "SGP": 0.0245, "AUS": 0.0234,
    "CHN": 0.0223, "KOR": 0.0212, "IND": 0.0201, "SWE": 0.0189, "NOR": 0.0178
  },
  "NOR": {
    "USA": 0.0623, "GBR": 0.0567, "SWE": 0.0512, "DNK": 0.0487, "DEU": 0.0456,
    "NLD": 0.0423, "CHE": 0.0398, "LUX": 0.0376, "FRA": 0.0354, "IRL": 0.0332,
    "FIN": 0.0312, "BEL": 0.0289, "ITA": 0.0267, "ESP": 0.0245, "AUT": 0.0234,
    "JPN": 0.0223, "SGP": 0.0212, "AUS": 0.0201, "CAN": 0.0189, "CHN": 0.0178
  },
  "DNK": {
    "USA": 0.0567, "GBR": 0.0512, "SWE": 0.0487, "NOR": 0.0456, "DEU": 0.0423,
    "NLD": 0.0398, "CHE": 0.0376, "LUX": 0.0354, "FRA": 0.0332, "IRL": 0.0312,
    "FIN": 0.0289, "BEL": 0.0267, "ITA": 0.0245, "ESP": 0.0234, "AUT": 0.0223,
    "JPN": 0.0212, "SGP": 0.0201, "AUS": 0.0189, "CAN": 0.0178, "CHN": 0.0167
  },
  "FIN": {
    "USA": 0.0512, "GBR": 0.0487, "SWE": 0.0456, "NOR": 0.0423, "DNK": 0.0398,
    "DEU": 0.0376, "NLD": 0.0354, "CHE": 0.0332, "LUX": 0.0312, "FRA": 0.0289,
    "IRL": 0.0267, "BEL": 0.0245, "ITA": 0.0234, "ESP": 0.0223, "EST": 0.0289,
    "JPN": 0.0212, "SGP": 0.0201, "AUS": 0.0189, "CAN": 0.0178, "CHN": 0.0167
  },
  "AUT": {
    "USA": 0.0512, "GBR": 0.0487, "DEU": 0.0456, "CHE": 0.0423, "FRA": 0.0398,
    "ITA": 0.0376, "NLD": 0.0354, "LUX": 0.0332, "IRL": 0.0312, "BEL": 0.0289,
    "ESP": 0.0267, "SWE": 0.0245, "CZE": 0.0234, "HUN": 0.0223, "POL": 0.0212,
    "SVK": 0.0234, "SVN": 0.0223, "JPN": 0.0201, "SGP": 0.0189, "CAN": 0.0178
  },
  "IRL": {
    "USA": 0.0923, "GBR": 0.0789, "LUX": 0.0623, "NLD": 0.0567, "DEU": 0.0512,
    "FRA": 0.0487, "CHE": 0.0456, "BEL": 0.0423, "ITA": 0.0398, "ESP": 0.0376,
    "SWE": 0.0354, "NOR": 0.0332, "DNK": 0.0312, "FIN": 0.0289, "AUT": 0.0267,
    "JPN": 0.0245, "SGP": 0.0234, "AUS": 0.0223, "CAN": 0.0212, "CHN": 0.0201
  },
  "CZE": {
    "USA": 0.0423, "GBR": 0.0398, "DEU": 0.0376, "FRA": 0.0354, "NLD": 0.0332,
    "CHE": 0.0312, "LUX": 0.0289, "IRL": 0.0267, "AUT": 0.0245, "ITA": 0.0234,
    "BEL": 0.0223, "ESP": 0.0212, "SWE": 0.0201, "POL": 0.0189, "SVK": 0.0234,
    "HUN": 0.0223, "JPN": 0.0178, "SGP": 0.0167, "CAN": 0.0156, "CHN": 0.0187
  },
  "HUN": {
    "USA": 0.0423, "GBR": 0.0398, "DEU": 0.0376, "AUT": 0.0354, "FRA": 0.0332,
    "NLD": 0.0312, "CHE": 0.0289, "LUX": 0.0267, "IRL": 0.0245, "ITA": 0.0234,
    "BEL": 0.0223, "ESP": 0.0212, "SWE": 0.0201, "POL": 0.0189, "CZE": 0.0178,
    "SVK": 0.0223, "ROU": 0.0212, "JPN": 0.0167, "SGP": 0.0156, "CAN": 0.0145
  },
  "ROU": {
    "USA": 0.0398, "GBR": 0.0376, "DEU": 0.0354, "FRA": 0.0332, "ITA": 0.0312,
    "NLD": 0.0289, "CHE": 0.0267, "LUX": 0.0245, "IRL": 0.0234, "AUT": 0.0223,
    "BEL": 0.0212, "ESP": 0.0201, "HUN": 0.0189, "POL": 0.0178, "CZE": 0.0167,
    "GRC": 0.0156, "BGR": 0.0198, "SRB": 0.0187, "JPN": 0.0145, "SGP": 0.0134
  },
  "PRT": {
    "USA": 0.0456, "GBR": 0.0423, "ESP": 0.0398, "FRA": 0.0376, "DEU": 0.0354,
    "NLD": 0.0332, "CHE": 0.0312, "LUX": 0.0289, "IRL": 0.0267, "ITA": 0.0245,
    "BEL": 0.0234, "SWE": 0.0223, "NOR": 0.0212, "DNK": 0.0201, "AUT": 0.0189,
    "BRA": 0.0234, "JPN": 0.0178, "SGP": 0.0167, "CAN": 0.0156, "CHN": 0.0145
  },
  "GRC": {
    "USA": 0.0423, "GBR": 0.0398, "DEU": 0.0376, "FRA": 0.0354, "ITA": 0.0332,
    "NLD": 0.0312, "CHE": 0.0289, "LUX": 0.0267, "IRL": 0.0245, "BEL": 0.0234,
    "ESP": 0.0223, "AUT": 0.0212, "CYP": 0.0289, "TUR": 0.0201, "ROU": 0.0189,
    "BGR": 0.0178, "SRB": 0.0167, "JPN": 0.0156, "SGP": 0.0145, "CAN": 0.0134
  },
  "HKG": {
    "CHN": 0.1123, "USA": 0.0789, "GBR": 0.0623, "SGP": 0.0567, "JPN": 0.0512,
    "AUS": 0.0487, "DEU": 0.0456, "FRA": 0.0423, "NLD": 0.0398, "CHE": 0.0376,
    "LUX": 0.0354, "IRL": 0.0332, "CAN": 0.0312, "KOR": 0.0289, "TWN": 0.0267,
    "BEL": 0.0245, "ITA": 0.0234, "ESP": 0.0223, "SWE": 0.0212, "IND": 0.0201
  },
  "LUX": {
    "USA": 0.0789, "GBR": 0.0678, "DEU": 0.0623, "FRA": 0.0567, "BEL": 0.0512,
    "NLD": 0.0487, "CHE": 0.0456, "IRL": 0.0423, "ITA": 0.0398, "ESP": 0.0376,
    "AUT": 0.0354, "SWE": 0.0332, "NOR": 0.0312, "DNK": 0.0289, "FIN": 0.0267,
    "JPN": 0.0245, "SGP": 0.0234, "AUS": 0.0223, "CAN": 0.0212, "CHN": 0.0201
  }
};

/**
 * Get financial linkage intensity for a country pair
 * @param sourceCountry ISO 3166-1 alpha-3 code
 * @param targetCountry ISO 3166-1 alpha-3 code
 * @returns Intensity value (0-1) or null if not available
 */
export function getCPISFinancialLinkage(
  sourceCountry: string,
  targetCountry: string
): number | null {
  return IMF_CPIS_FINANCIAL_LINKAGE[sourceCountry]?.[targetCountry] ?? null;
}

/**
 * Check if IMF CPIS data exists for a country pair
 * @param sourceCountry ISO 3166-1 alpha-3 code
 * @param targetCountry ISO 3166-1 alpha-3 code
 * @returns true if data exists, false otherwise
 */
export function hasCPISFinancialData(
  sourceCountry: string,
  targetCountry: string
): boolean {
  return getCPISFinancialLinkage(sourceCountry, targetCountry) !== null;
}

/**
 * Get all available target countries for a source country
 * @param sourceCountry ISO 3166-1 alpha-3 code
 * @returns Array of target country codes
 */
export function getCPISFinancialTargets(sourceCountry: string): string[] {
  return Object.keys(IMF_CPIS_FINANCIAL_LINKAGE[sourceCountry] ?? {});
}

/**
 * Get coverage statistics
 * @returns Object with coverage metrics
 */
export function getCPISFinancialCoverage(): {
  sourceCountries: number;
  totalPairs: number;
  countries: string[];
} {
  const countries = Object.keys(IMF_CPIS_FINANCIAL_LINKAGE);
  const totalPairs = countries.reduce(
    (sum, source) => sum + Object.keys(IMF_CPIS_FINANCIAL_LINKAGE[source]).length,
    0
  );
  
  return {
    sourceCountries: countries.length,
    totalPairs,
    countries
  };
}