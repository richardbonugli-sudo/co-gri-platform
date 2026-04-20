/**
 * Exposure Type Definitions
 * 
 * PHASE 2 - Task 2: Standardized output interfaces
 * 
 * Purpose: Define consistent type interfaces for all exposure outputs
 * to ensure semantic clarity and prevent confusion between weights and percentages.
 */

/**
 * Country Exposure (Standardized Output)
 * 
 * All exposure values are in percentage scale (0-100)
 * Absolute values are optional and always labeled with units
 */
export interface CountryExposure {
  /** Country name (standardized) */
  country: string;
  
  /** Exposure as percentage of total (0-100 scale) */
  exposurePercentage: number;
  
  /** Absolute value in millions USD (optional) */
  absoluteValue?: number;
  
  /** Unit for absolute value */
  absoluteValueUnit?: string;
  
  /** Channel (revenue, supply, assets, financial) */
  channel: string;
  
  /** Evidence level (DIRECT, SSF, RF-A/B/C/D, GF) */
  evidenceLevel: string;
  
  /** Confidence score (0-100 scale) */
  confidence: number;
  
  /** Additional metadata */
  metadata?: {
    /** Source of data (structured, narrative, fallback) */
    source?: string;
    
    /** Reasoning for allocation */
    reason?: string;
    
    /** Whether this was decomposed from regional data */
    decomposed?: boolean;
    
    /** Original regional segment if decomposed */
    originalSegment?: string;
  };
}

/**
 * Channel Allocation Result (Standardized Output)
 * 
 * All weights are in percentage scale (0-100)
 */
export interface ChannelAllocationResult {
  /** Channel name */
  channel: string;
  
  /** Country exposures (percentage scale 0-100) */
  countries: CountryExposure[];
  
  /** Total percentage (should be 100.0) */
  totalPercentage: number;
  
  /** Validation status */
  validationPassed: boolean;
  
  /** Validation errors if any */
  validationErrors?: string[];
  
  /** Calculation metadata */
  metadata?: {
    /** Calculation method used */
    method?: string;
    
    /** Evidence quality score */
    evidenceQuality?: number;
    
    /** Number of countries allocated */
    countryCount?: number;
    
    /** Whether regional decomposition was applied */
    decompositionApplied?: boolean;
  };
}

/**
 * Company Exposure Summary (Standardized Output)
 * 
 * All percentages in 0-100 scale
 */
export interface CompanyExposureSummary {
  /** Company ticker */
  ticker: string;
  
  /** Company name */
  companyName: string;
  
  /** Home country */
  homeCountry: string;
  
  /** Sector */
  sector: string;
  
  /** Channel allocations */
  channels: {
    revenue?: ChannelAllocationResult;
    supply?: ChannelAllocationResult;
    assets?: ChannelAllocationResult;
    financial?: ChannelAllocationResult;
  };
  
  /** Overall country risk scores (0-100 scale) */
  overallCountryRisk?: Map<string, number>;
  
  /** Calculation timestamp */
  calculatedAt: Date;
  
  /** Data quality metrics */
  dataQuality?: {
    /** Overall data completeness (0-100) */
    completeness: number;
    
    /** Evidence strength (0-100) */
    evidenceStrength: number;
    
    /** Confidence in allocations (0-100) */
    confidence: number;
  };
}

/**
 * Country Provenance Table Row (Standardized Output)
 * 
 * For display in Country Provenance table
 */
export interface CountryProvenanceRow {
  /** Country name */
  country: string;
  
  /** Exposure percentage (0-100 scale, formatted) */
  exposurePercentage: string;  // e.g., "45.2%"
  
  /** Absolute value (formatted with units) */
  absoluteValue: string;  // e.g., "$152,233M"
  
  /** Evidence level (formatted) */
  evidenceLevel: string;  // e.g., "Direct (Structured)"
  
  /** Confidence (0-100 scale, formatted) */
  confidence: string;  // e.g., "95%"
  
  /** Channel */
  channel: string;
  
  /** Raw values for sorting/filtering */
  raw: {
    exposurePercentage: number;  // 0-100 scale
    absoluteValue: number;  // millions USD
    confidence: number;  // 0-100 scale
  };
}

/**
 * Validation Result
 */
export interface ValidationResult {
  /** Whether validation passed */
  passed: boolean;
  
  /** Validation errors */
  errors: string[];
  
  /** Validation warnings */
  warnings: string[];
  
  /** Validation metadata */
  metadata?: {
    /** Total percentage sum */
    totalPercentage?: number;
    
    /** Expected total */
    expectedTotal?: number;
    
    /** Number of countries */
    countryCount?: number;
    
    /** Number of zero/negative values */
    invalidValueCount?: number;
  };
}

/**
 * Decomposition Metadata
 */
export interface DecompositionMetadata {
  /** Whether decomposition was applied */
  applied: boolean;
  
  /** Original regional segments */
  originalSegments?: string[];
  
  /** Number of countries after decomposition */
  countryCount?: number;
  
  /** Decomposition method */
  method?: string;
  
  /** Validation status */
  validated?: boolean;
}

/**
 * Evidence Bundle Metadata
 */
export interface EvidenceBundleMetadata {
  /** Has structured data */
  hasStructured: boolean;
  
  /** Has narrative data */
  hasNarrative: boolean;
  
  /** Evidence quality score (0-100) */
  qualityScore: number;
  
  /** Data completeness (0-100) */
  completeness: number;
  
  /** Confidence level (0-100) */
  confidence: number;
}