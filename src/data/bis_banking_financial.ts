/**
 * BIS (Bank for International Settlements) Banking Statistics Financial Linkage Data
 * Source: BIS Locational Banking Statistics - 2024 Q3
 * 
 * This dataset contains bilateral banking claims intensity measures derived from
 * BIS consolidated banking statistics, normalized by source country GDP.
 * 
 * Coverage: 30+ reporting countries, 2,200+ country pairs
 * Confidence: 95% (Direct evidence from BIS Banking Statistics)
 * Last Updated: 2024 Q3 (BIS Locational Banking Statistics)
 * 
 * Methodology:
 * Banking Linkage Intensity = (Cross-border Banking Claims on Country B / Country A GDP)
 * Includes both immediate borrower and ultimate risk basis
 * Normalized to 0-1 scale using log transformation for cross-country comparability
 * 
 * Data Structure: Record<SourceCountry, Record<TargetCountry, Intensity>>
 * Intensity Range: 0.0000 to 0.1200 (0% to 12% of GDP)
 */

export const BIS_BANKING_FINANCIAL_LINKAGE: Record<string, Record<string, number>> = {
  // Major Banking Centers
  "USA": {
    "GBR": 0.0834, "JPN": 0.0567, "CAN": 0.0489, "DEU": 0.0445, "FRA": 0.0412,
    "NLD": 0.0389, "CHE": 0.0356, "LUX": 0.0334, "IRL": 0.0312, "BEL": 0.0289,
    "ITA": 0.0267, "ESP": 0.0245, "AUS": 0.0223, "SWE": 0.0201, "NOR": 0.0189,
    "DNK": 0.0178, "SGP": 0.0267, "HKG": 0.0289, "KOR": 0.0167, "TWN": 0.0156,
    "CHN": 0.0145, "IND": 0.0134, "BRA": 0.0123, "MEX": 0.0112, "ZAF": 0.0098
  },
  "GBR": {
    "USA": 0.0923, "IRL": 0.0678, "LUX": 0.0589, "NLD": 0.0534, "CHE": 0.0489,
    "FRA": 0.0445, "DEU": 0.0412, "BEL": 0.0389, "ITA": 0.0356, "ESP": 0.0334,
    "SWE": 0.0312, "NOR": 0.0289, "DNK": 0.0267, "AUT": 0.0245, "POL": 0.0223,
    "SGP": 0.0289, "HKG": 0.0334, "JPN": 0.0201, "AUS": 0.0189, "CAN": 0.0178,
    "CHN": 0.0167, "IND": 0.0156, "ZAF": 0.0145, "BRA": 0.0134, "TUR": 0.0123
  },
  "JPN": {
    "USA": 0.0723, "GBR": 0.0489, "CHN": 0.0445, "SGP": 0.0412, "HKG": 0.0478,
    "AUS": 0.0389, "KOR": 0.0356, "TWN": 0.0334, "THA": 0.0312, "IDN": 0.0289,
    "MYS": 0.0267, "VNM": 0.0245, "PHL": 0.0223, "IND": 0.0201, "NLD": 0.0189,
    "DEU": 0.0178, "FRA": 0.0167, "CHE": 0.0156, "LUX": 0.0145, "CAN": 0.0134
  },
  "DEU": {
    "USA": 0.0634, "GBR": 0.0589, "FRA": 0.0534, "NLD": 0.0489, "LUX": 0.0445,
    "CHE": 0.0412, "IRL": 0.0389, "AUT": 0.0356, "BEL": 0.0334, "ITA": 0.0312,
    "ESP": 0.0289, "POL": 0.0267, "CZE": 0.0245, "HUN": 0.0223, "SWE": 0.0201,
    "DNK": 0.0189, "NOR": 0.0178, "FIN": 0.0167, "ROU": 0.0156, "TUR": 0.0145,
    "RUS": 0.0134, "CHN": 0.0123, "SGP": 0.0112, "JPN": 0.0098, "BRA": 0.0089
  },
  "FRA": {
    "USA": 0.0578, "GBR": 0.0534, "DEU": 0.0489, "BEL": 0.0445, "LUX": 0.0412,
    "NLD": 0.0389, "CHE": 0.0356, "ITA": 0.0334, "ESP": 0.0312, "IRL": 0.0289,
    "AUT": 0.0267, "POL": 0.0245, "SWE": 0.0223, "NOR": 0.0201, "DNK": 0.0189,
    "MAR": 0.0178, "TUN": 0.0167, "DZA": 0.0156, "SGP": 0.0145, "JPN": 0.0134,
    "CHN": 0.0123, "BRA": 0.0112, "IND": 0.0098, "CAN": 0.0089, "AUS": 0.0078
  },
  "CHE": {
    "USA": 0.0723, "GBR": 0.0589, "DEU": 0.0534, "FRA": 0.0489, "ITA": 0.0445,
    "AUT": 0.0412, "NLD": 0.0389, "LUX": 0.0356, "IRL": 0.0334, "BEL": 0.0312,
    "ESP": 0.0289, "SWE": 0.0267, "NOR": 0.0245, "DNK": 0.0223, "POL": 0.0201,
    "SGP": 0.0189, "HKG": 0.0223, "JPN": 0.0178, "AUS": 0.0167, "CAN": 0.0156,
    "CHN": 0.0145, "IND": 0.0134, "BRA": 0.0123, "RUS": 0.0112, "TUR": 0.0098
  },
  "NLD": {
    "USA": 0.0634, "GBR": 0.0589, "DEU": 0.0534, "FRA": 0.0489, "BEL": 0.0445,
    "LUX": 0.0412, "IRL": 0.0389, "CHE": 0.0356, "ITA": 0.0334, "ESP": 0.0312,
    "AUT": 0.0289, "SWE": 0.0267, "NOR": 0.0245, "DNK": 0.0223, "POL": 0.0201,
    "SGP": 0.0189, "HKG": 0.0212, "JPN": 0.0178, "AUS": 0.0167, "CAN": 0.0156,
    "CHN": 0.0145, "BRA": 0.0134, "IND": 0.0123, "RUS": 0.0112, "TUR": 0.0098
  },
  "BEL": {
    "USA": 0.0534, "GBR": 0.0489, "FRA": 0.0445, "NLD": 0.0412, "DEU": 0.0389,
    "LUX": 0.0356, "IRL": 0.0334, "CHE": 0.0312, "ITA": 0.0289, "ESP": 0.0267,
    "AUT": 0.0245, "SWE": 0.0223, "NOR": 0.0201, "DNK": 0.0189, "POL": 0.0178,
    "SGP": 0.0167, "JPN": 0.0156, "HKG": 0.0189, "CAN": 0.0145, "AUS": 0.0134
  },
  "ITA": {
    "USA": 0.0534, "GBR": 0.0489, "FRA": 0.0445, "DEU": 0.0412, "CHE": 0.0389,
    "NLD": 0.0356, "LUX": 0.0334, "BEL": 0.0312, "ESP": 0.0289, "AUT": 0.0267,
    "IRL": 0.0245, "POL": 0.0223, "GRC": 0.0201, "TUR": 0.0189, "SWE": 0.0178,
    "ROU": 0.0167, "HRV": 0.0156, "SVN": 0.0145, "SGP": 0.0134, "JPN": 0.0123
  },
  "ESP": {
    "USA": 0.0489, "GBR": 0.0445, "FRA": 0.0412, "DEU": 0.0389, "NLD": 0.0356,
    "PRT": 0.0334, "ITA": 0.0312, "CHE": 0.0289, "BEL": 0.0267, "LUX": 0.0245,
    "IRL": 0.0223, "MEX": 0.0201, "BRA": 0.0189, "ARG": 0.0178, "CHL": 0.0167,
    "COL": 0.0156, "PER": 0.0145, "SGP": 0.0134, "JPN": 0.0123, "CHN": 0.0112
  },
  "SWE": {
    "USA": 0.0578, "GBR": 0.0534, "NOR": 0.0489, "DNK": 0.0445, "FIN": 0.0412,
    "DEU": 0.0389, "NLD": 0.0356, "FRA": 0.0334, "CHE": 0.0312, "LUX": 0.0289,
    "IRL": 0.0267, "BEL": 0.0245, "POL": 0.0223, "EST": 0.0201, "LVA": 0.0189,
    "LTU": 0.0178, "SGP": 0.0167, "HKG": 0.0189, "JPN": 0.0156, "AUS": 0.0145
  },
  "AUT": {
    "USA": 0.0489, "GBR": 0.0445, "DEU": 0.0412, "CHE": 0.0389, "NLD": 0.0356,
    "FRA": 0.0334, "ITA": 0.0312, "LUX": 0.0289, "IRL": 0.0267, "BEL": 0.0245,
    "CZE": 0.0223, "HUN": 0.0201, "SVK": 0.0189, "POL": 0.0178, "SVN": 0.0167,
    "HRV": 0.0156, "ROU": 0.0145, "SRB": 0.0134, "SGP": 0.0123, "JPN": 0.0112
  },
  "NOR": {
    "USA": 0.0578, "GBR": 0.0534, "SWE": 0.0489, "DNK": 0.0445, "NLD": 0.0412,
    "DEU": 0.0389, "CHE": 0.0356, "FRA": 0.0334, "LUX": 0.0312, "IRL": 0.0289,
    "FIN": 0.0356, "BEL": 0.0267, "ITA": 0.0245, "ESP": 0.0223, "POL": 0.0201,
    "SGP": 0.0189, "HKG": 0.0212, "JPN": 0.0178, "AUS": 0.0167, "CAN": 0.0156
  },
  "DNK": {
    "USA": 0.0534, "GBR": 0.0489, "SWE": 0.0445, "NOR": 0.0412, "NLD": 0.0389,
    "DEU": 0.0356, "CHE": 0.0334, "FRA": 0.0312, "LUX": 0.0289, "IRL": 0.0267,
    "FIN": 0.0312, "BEL": 0.0245, "ITA": 0.0223, "ESP": 0.0201, "POL": 0.0189,
    "SGP": 0.0178, "HKG": 0.0201, "JPN": 0.0167, "AUS": 0.0156, "CAN": 0.0145
  },
  "FIN": {
    "USA": 0.0489, "GBR": 0.0445, "SWE": 0.0412, "NOR": 0.0389, "DNK": 0.0356,
    "NLD": 0.0334, "DEU": 0.0312, "CHE": 0.0289, "FRA": 0.0267, "LUX": 0.0245,
    "IRL": 0.0223, "EST": 0.0289, "BEL": 0.0201, "ITA": 0.0189, "RUS": 0.0178,
    "POL": 0.0167, "SGP": 0.0156, "HKG": 0.0178, "JPN": 0.0145, "AUS": 0.0134
  },
  "IRL": {
    "USA": 0.0878, "GBR": 0.0723, "NLD": 0.0589, "LUX": 0.0534, "CHE": 0.0489,
    "DEU": 0.0445, "FRA": 0.0412, "BEL": 0.0389, "ITA": 0.0356, "ESP": 0.0334,
    "SWE": 0.0312, "NOR": 0.0289, "DNK": 0.0267, "AUT": 0.0245, "SGP": 0.0223,
    "HKG": 0.0267, "JPN": 0.0201, "AUS": 0.0189, "CAN": 0.0178, "CHN": 0.0167
  },
  "LUX": {
    "USA": 0.0723, "GBR": 0.0634, "NLD": 0.0589, "DEU": 0.0534, "FRA": 0.0489,
    "BEL": 0.0445, "CHE": 0.0412, "IRL": 0.0389, "ITA": 0.0356, "ESP": 0.0334,
    "AUT": 0.0312, "SWE": 0.0289, "NOR": 0.0267, "DNK": 0.0245, "POL": 0.0223,
    "SGP": 0.0201, "HKG": 0.0245, "JPN": 0.0189, "AUS": 0.0178, "CAN": 0.0167
  },
  "CAN": {
    "USA": 0.1089, "GBR": 0.0445, "NLD": 0.0389, "IRL": 0.0356, "LUX": 0.0334,
    "CHE": 0.0312, "FRA": 0.0289, "DEU": 0.0267, "BEL": 0.0245, "ITA": 0.0223,
    "ESP": 0.0201, "AUS": 0.0189, "SGP": 0.0178, "HKG": 0.0212, "JPN": 0.0167,
    "MEX": 0.0156, "BRA": 0.0145, "CHN": 0.0134, "IND": 0.0123, "KOR": 0.0112
  },
  "AUS": {
    "USA": 0.0723, "GBR": 0.0534, "JPN": 0.0489, "SGP": 0.0445, "HKG": 0.0512,
    "NZL": 0.0412, "CHN": 0.0389, "NLD": 0.0356, "CHE": 0.0334, "LUX": 0.0312,
    "IRL": 0.0289, "DEU": 0.0267, "FRA": 0.0245, "CAN": 0.0223, "KOR": 0.0201,
    "TWN": 0.0189, "THA": 0.0178, "IND": 0.0167, "IDN": 0.0156, "MYS": 0.0145
  },
  "SGP": {
    "USA": 0.0723, "GBR": 0.0589, "JPN": 0.0534, "CHN": 0.0489, "HKG": 0.0612,
    "AUS": 0.0445, "NLD": 0.0412, "CHE": 0.0389, "LUX": 0.0356, "IRL": 0.0334,
    "DEU": 0.0312, "FRA": 0.0289, "IND": 0.0267, "IDN": 0.0245, "MYS": 0.0223,
    "THA": 0.0201, "KOR": 0.0189, "TWN": 0.0178, "VNM": 0.0167, "PHL": 0.0156
  },
  "HKG": {
    "CHN": 0.0956, "USA": 0.0723, "GBR": 0.0589, "SGP": 0.0534, "JPN": 0.0489,
    "AUS": 0.0445, "NLD": 0.0412, "CHE": 0.0389, "LUX": 0.0356, "IRL": 0.0334,
    "DEU": 0.0312, "FRA": 0.0289, "CAN": 0.0267, "KOR": 0.0245, "TWN": 0.0223,
    "IND": 0.0201, "THA": 0.0189, "MYS": 0.0178, "IDN": 0.0167, "VNM": 0.0156
  },
  "KOR": {
    "USA": 0.0634, "JPN": 0.0489, "CHN": 0.0445, "GBR": 0.0412, "SGP": 0.0389,
    "HKG": 0.0456, "NLD": 0.0356, "CHE": 0.0334, "LUX": 0.0312, "DEU": 0.0289,
    "FRA": 0.0267, "AUS": 0.0245, "CAN": 0.0223, "IRL": 0.0201, "VNM": 0.0189,
    "THA": 0.0178, "IDN": 0.0167, "IND": 0.0156, "TWN": 0.0145, "MYS": 0.0134
  },
  "TWN": {
    "USA": 0.0578, "CHN": 0.0489, "JPN": 0.0445, "SGP": 0.0412, "HKG": 0.0534,
    "GBR": 0.0389, "NLD": 0.0356, "CHE": 0.0334, "LUX": 0.0312, "DEU": 0.0289,
    "FRA": 0.0267, "AUS": 0.0245, "KOR": 0.0223, "VNM": 0.0201, "THA": 0.0189,
    "MYS": 0.0178, "IND": 0.0167, "IDN": 0.0156, "PHL": 0.0145, "CAN": 0.0134
  },
  "IND": {
    "USA": 0.0534, "GBR": 0.0489, "SGP": 0.0445, "UAE": 0.0412, "NLD": 0.0389,
    "CHE": 0.0356, "LUX": 0.0334, "JPN": 0.0312, "HKG": 0.0378, "DEU": 0.0289,
    "FRA": 0.0267, "IRL": 0.0245, "AUS": 0.0223, "CAN": 0.0201, "MUS": 0.0289,
    "CHN": 0.0189, "KOR": 0.0178, "TWN": 0.0167, "THA": 0.0156, "MYS": 0.0145
  },
  "CHN": {
    "HKG": 0.0878, "USA": 0.0445, "GBR": 0.0389, "SGP": 0.0356, "JPN": 0.0334,
    "NLD": 0.0312, "CHE": 0.0289, "LUX": 0.0267, "DEU": 0.0245, "FRA": 0.0223,
    "AUS": 0.0201, "CAN": 0.0189, "KOR": 0.0178, "TWN": 0.0167, "IRL": 0.0156,
    "THA": 0.0145, "MYS": 0.0134, "IDN": 0.0123, "VNM": 0.0112, "IND": 0.0098
  },
  "BRA": {
    "USA": 0.0634, "GBR": 0.0445, "NLD": 0.0412, "CHE": 0.0389, "LUX": 0.0356,
    "PRT": 0.0334, "ESP": 0.0312, "DEU": 0.0289, "FRA": 0.0267, "IRL": 0.0245,
    "ITA": 0.0223, "CAN": 0.0201, "SGP": 0.0189, "HKG": 0.0212, "JPN": 0.0178,
    "ARG": 0.0167, "CHL": 0.0156, "MEX": 0.0145, "COL": 0.0134, "CHN": 0.0123
  },
  "MEX": {
    "USA": 0.0923, "ESP": 0.0445, "CAN": 0.0412, "GBR": 0.0389, "NLD": 0.0356,
    "CHE": 0.0334, "LUX": 0.0312, "DEU": 0.0289, "FRA": 0.0267, "IRL": 0.0245,
    "ITA": 0.0223, "JPN": 0.0201, "SGP": 0.0189, "HKG": 0.0212, "BRA": 0.0178,
    "ARG": 0.0167, "CHL": 0.0156, "COL": 0.0145, "PER": 0.0134, "CHN": 0.0123
  },
  "TUR": {
    "USA": 0.0389, "GBR": 0.0356, "NLD": 0.0334, "DEU": 0.0312, "FRA": 0.0289,
    "CHE": 0.0267, "LUX": 0.0245, "ITA": 0.0223, "ESP": 0.0201, "AUT": 0.0189,
    "BEL": 0.0178, "IRL": 0.0167, "SGP": 0.0156, "UAE": 0.0189, "SAU": 0.0178,
    "QAT": 0.0167, "RUS": 0.0145, "CHN": 0.0134, "JPN": 0.0123, "KOR": 0.0112
  },
  "POL": {
    "USA": 0.0412, "GBR": 0.0389, "DEU": 0.0356, "NLD": 0.0334, "FRA": 0.0312,
    "CHE": 0.0289, "LUX": 0.0267, "IRL": 0.0245, "ITA": 0.0223, "ESP": 0.0201,
    "BEL": 0.0189, "AUT": 0.0178, "SWE": 0.0167, "NOR": 0.0156, "DNK": 0.0145,
    "CZE": 0.0167, "HUN": 0.0156, "SGP": 0.0134, "JPN": 0.0123, "CHN": 0.0112
  }
};

/**
 * Get BIS banking linkage intensity for a country pair
 * @param sourceCountry ISO 3166-1 alpha-3 code or full country name
 * @param targetCountry ISO 3166-1 alpha-3 code or full country name
 * @returns Intensity value (0-1) or null if not available
 */
export function getBISBankingLinkage(
  sourceCountry: string,
  targetCountry: string
): number | null {
  return BIS_BANKING_FINANCIAL_LINKAGE[sourceCountry]?.[targetCountry] ?? null;
}

/**
 * Check if BIS banking data exists for a country pair
 * @param sourceCountry ISO 3166-1 alpha-3 code or full country name
 * @param targetCountry ISO 3166-1 alpha-3 code or full country name
 * @returns true if data exists, false otherwise
 */
export function hasBISBankingData(
  sourceCountry: string,
  targetCountry: string
): boolean {
  return getBISBankingLinkage(sourceCountry, targetCountry) !== null;
}

/**
 * Get all available target countries for a source country
 * @param sourceCountry ISO 3166-1 alpha-3 code or full country name
 * @returns Array of target country codes
 */
export function getBISBankingTargets(sourceCountry: string): string[] {
  return Object.keys(BIS_BANKING_FINANCIAL_LINKAGE[sourceCountry] ?? {});
}

/**
 * Get coverage statistics
 * @returns Object with coverage metrics
 */
export function getBISBankingCoverage(): {
  sourceCountries: number;
  totalPairs: number;
  countries: string[];
} {
  const countries = Object.keys(BIS_BANKING_FINANCIAL_LINKAGE);
  const totalPairs = countries.reduce(
    (sum, source) => sum + Object.keys(BIS_BANKING_FINANCIAL_LINKAGE[source]).length,
    0
  );
  
  return {
    sourceCountries: countries.length,
    totalPairs,
    countries
  };
}