/**
 * Formatting Utilities
 * 
 * PHASE 2 - Task 2: Standardize output semantics
 * 
 * Purpose: Provide consistent formatting for exposure percentages, absolute values,
 * and confidence scores to prevent user confusion.
 * 
 * Standards:
 * - All exposure outputs use percentages (0-100 scale)
 * - Absolute values always include unit label "(millions USD)"
 * - Clear labeling of "Percentage of Total Revenue" vs "Absolute Value"
 */

/**
 * Format exposure percentage
 * Converts any numeric value to percentage format with one decimal place
 * 
 * @param value - Numeric value (can be 0-1 scale or 0-100 scale)
 * @param autoDetect - Automatically detect scale (default: true)
 * @returns Formatted percentage string (e.g., "45.2%")
 * 
 * @example
 * formatExposurePercentage(0.452) // "45.2%"
 * formatExposurePercentage(45.2) // "45.2%"
 * formatExposurePercentage(0.001) // "0.1%"
 */
export function formatExposurePercentage(value: number, autoDetect: boolean = true): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0.0%";
  }
  
  let percentage = value;
  
  // Auto-detect scale: if value is between 0-1, assume it's a weight (0-1 scale)
  if (autoDetect && value >= 0 && value <= 1) {
    percentage = value * 100;
  }
  
  // Format with one decimal place
  return `${percentage.toFixed(1)}%`;
}

/**
 * Format absolute value with unit
 * Converts numeric value to formatted string with thousands separator and unit
 * 
 * @param value - Numeric value
 * @param unit - Unit of measurement (default: "millions_usd")
 * @returns Formatted absolute value string (e.g., "$152,233M")
 * 
 * @example
 * formatAbsoluteValue(152233) // "$152,233M"
 * formatAbsoluteValue(152233, "millions_eur") // "€152,233M"
 * formatAbsoluteValue(1522.33, "thousands_usd") // "$1,522K"
 */
export function formatAbsoluteValue(value: number, unit: string = "millions_usd"): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "$0M";
  }
  
  // Determine currency symbol
  let currencySymbol = "$";
  if (unit.includes("eur")) {
    currencySymbol = "€";
  } else if (unit.includes("gbp")) {
    currencySymbol = "£";
  } else if (unit.includes("jpy") || unit.includes("cny")) {
    currencySymbol = "¥";
  }
  
  // Determine magnitude suffix
  let suffix = "M";
  if (unit.includes("thousands")) {
    suffix = "K";
  } else if (unit.includes("billions")) {
    suffix = "B";
  }
  
  // Format with thousands separator
  const formatted = Math.round(value).toLocaleString('en-US');
  
  return `${currencySymbol}${formatted}${suffix}`;
}

/**
 * Format confidence score
 * Converts numeric value to percentage format with no decimal places
 * 
 * @param value - Numeric value (can be 0-1 scale or 0-100 scale)
 * @param autoDetect - Automatically detect scale (default: true)
 * @returns Formatted confidence string (e.g., "95%")
 * 
 * @example
 * formatConfidence(0.95) // "95%"
 * formatConfidence(95) // "95%"
 * formatConfidence(0.999) // "100%"
 */
export function formatConfidence(value: number, autoDetect: boolean = true): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0%";
  }
  
  let percentage = value;
  
  // Auto-detect scale: if value is between 0-1, assume it's a weight (0-1 scale)
  if (autoDetect && value >= 0 && value <= 1) {
    percentage = value * 100;
  }
  
  // Format with no decimal places, round to nearest integer
  return `${Math.round(percentage)}%`;
}

/**
 * Format country name for display
 * Ensures consistent capitalization and formatting
 * 
 * @param country - Country name
 * @returns Formatted country name
 * 
 * @example
 * formatCountryName("united states") // "United States"
 * formatCountryName("CHINA") // "China"
 */
export function formatCountryName(country: string): string {
  if (!country) {
    return "";
  }
  
  // Special cases
  const specialCases: Record<string, string> = {
    "usa": "United States",
    "us": "United States",
    "uk": "United Kingdom",
    "uae": "United Arab Emirates"
  };
  
  const normalized = country.toLowerCase().trim();
  if (specialCases[normalized]) {
    return specialCases[normalized];
  }
  
  // Title case
  return country
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format evidence level for display
 * 
 * @param level - Evidence level (e.g., "DIRECT", "SSF", "RF-A")
 * @returns Formatted evidence level with description
 * 
 * @example
 * formatEvidenceLevel("DIRECT") // "Direct (Structured)"
 * formatEvidenceLevel("RF-B") // "RF-B (Named Countries)"
 */
export function formatEvidenceLevel(level: string): string {
  const descriptions: Record<string, string> = {
    "DIRECT": "Direct (Structured)",
    "SSF": "SSF (Membership)",
    "RF-A": "RF-A (Conservative)",
    "RF-B": "RF-B (Named Countries)",
    "RF-C": "RF-C (Geo Labels)",
    "RF-D": "RF-D (Partial Evidence)",
    "GF": "GF (Global)"
  };
  
  return descriptions[level] || level;
}

/**
 * Convert weight (0-1 scale) to percentage (0-100 scale)
 * 
 * @param weight - Weight value (0-1 scale)
 * @returns Percentage value (0-100 scale)
 */
export function weightToPercentage(weight: number): number {
  if (weight === null || weight === undefined || isNaN(weight)) {
    return 0;
  }
  
  // If already in percentage scale (>1), return as-is
  if (weight > 1) {
    return weight;
  }
  
  return weight * 100;
}

/**
 * Convert percentage (0-100 scale) to weight (0-1 scale)
 * 
 * @param percentage - Percentage value (0-100 scale)
 * @returns Weight value (0-1 scale)
 */
export function percentageToWeight(percentage: number): number {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return 0;
  }
  
  // If already in weight scale (0-1), return as-is
  if (percentage <= 1) {
    return percentage;
  }
  
  return percentage / 100;
}

/**
 * Format table cell value based on column type
 * 
 * @param value - Cell value
 * @param columnType - Type of column ("percentage", "absolute", "confidence", "country", "evidence")
 * @param unit - Unit for absolute values (optional)
 * @returns Formatted cell value
 */
export function formatTableCell(
  value: any,
  columnType: "percentage" | "absolute" | "confidence" | "country" | "evidence" | "text",
  unit?: string
): string {
  if (value === null || value === undefined) {
    return "-";
  }
  
  switch (columnType) {
    case "percentage":
      return formatExposurePercentage(value);
    case "absolute":
      return formatAbsoluteValue(value, unit);
    case "confidence":
      return formatConfidence(value);
    case "country":
      return formatCountryName(value);
    case "evidence":
      return formatEvidenceLevel(value);
    case "text":
    default:
      return String(value);
  }
}

/**
 * Validate that a value is in percentage scale (0-100)
 * 
 * @param value - Value to validate
 * @returns True if value appears to be in percentage scale
 */
export function isPercentageScale(value: number): boolean {
  if (value === null || value === undefined || isNaN(value)) {
    return false;
  }
  
  // If value is greater than 1, assume it's percentage scale
  // If value is between 0-1, assume it's weight scale
  return value > 1;
}

/**
 * Ensure value is in percentage scale (0-100)
 * 
 * @param value - Value to convert
 * @returns Value in percentage scale
 */
export function ensurePercentageScale(value: number): number {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  
  if (isPercentageScale(value)) {
    return value;
  }
  
  return weightToPercentage(value);
}

/**
 * Ensure value is in weight scale (0-1)
 * 
 * @param value - Value to convert
 * @returns Value in weight scale
 */
export function ensureWeightScale(value: number): number {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  
  if (!isPercentageScale(value)) {
    return value;
  }
  
  return percentageToWeight(value);
}