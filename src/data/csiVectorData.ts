/**
 * CSI Vector Decomposition Data
 * 
 * Contains the 7-vector breakdown (SC1-SC7) for all countries
 * These represent the share of each country's CSI attributable to each risk vector
 * 
 * Vectors:
 * - conflict: Conflict & Security (SC1) - Weight: 0.22
 * - sanctions: Sanctions & Regulatory Pressure (SC2) - Weight: 0.18
 * - trade: Trade & Logistics Disruption (SC3) - Weight: 0.16
 * - governance: Governance & Rule of Law (SC4) - Weight: 0.14
 * - cyber: Cyber & Data Sovereignty (SC5) - Weight: 0.12
 * - unrest: Public Unrest & Labor Instability (SC6) - Weight: 0.10
 * - currency: Currency & Capital Controls (SC7) - Weight: 0.08
 * 
 * Values represent the relative contribution of each vector to the country's total CSI
 * and should sum to approximately 1.0 for each country
 */

export interface CSIVectorBreakdown {
  conflict: number;
  sanctions: number;
  trade: number;
  governance: number;
  cyber: number;
  unrest: number;
  currency: number;
}

export const CSI_VECTOR_DATA: Record<string, CSIVectorBreakdown> = {
  'United States': {
    conflict: 0.15,
    sanctions: 0.10,
    trade: 0.18,
    governance: 0.12,
    cyber: 0.20,
    unrest: 0.15,
    currency: 0.10,
  },
  'China': {
    conflict: 0.20,
    sanctions: 0.25,
    trade: 0.20,
    governance: 0.15,
    cyber: 0.10,
    unrest: 0.05,
    currency: 0.05,
  },
  'Japan': {
    conflict: 0.18,
    sanctions: 0.08,
    trade: 0.22,
    governance: 0.08,
    cyber: 0.18,
    unrest: 0.12,
    currency: 0.14,
  },
  'Germany': {
    conflict: 0.12,
    sanctions: 0.15,
    trade: 0.25,
    governance: 0.10,
    cyber: 0.15,
    unrest: 0.13,
    currency: 0.10,
  },
  'India': {
    conflict: 0.22,
    sanctions: 0.12,
    trade: 0.18,
    governance: 0.18,
    cyber: 0.12,
    unrest: 0.12,
    currency: 0.06,
  },
  'United Kingdom': {
    conflict: 0.15,
    sanctions: 0.12,
    trade: 0.20,
    governance: 0.10,
    cyber: 0.18,
    unrest: 0.15,
    currency: 0.10,
  },
  'France': {
    conflict: 0.16,
    sanctions: 0.12,
    trade: 0.18,
    governance: 0.12,
    cyber: 0.14,
    unrest: 0.18,
    currency: 0.10,
  },
  'Brazil': {
    conflict: 0.15,
    sanctions: 0.10,
    trade: 0.18,
    governance: 0.20,
    cyber: 0.10,
    unrest: 0.15,
    currency: 0.12,
  },
  'Canada': {
    conflict: 0.12,
    sanctions: 0.08,
    trade: 0.22,
    governance: 0.10,
    cyber: 0.16,
    unrest: 0.14,
    currency: 0.18,
  },
  'Russia': {
    conflict: 0.30,
    sanctions: 0.35,
    trade: 0.15,
    governance: 0.10,
    cyber: 0.05,
    unrest: 0.03,
    currency: 0.02,
  },
  'South Korea': {
    conflict: 0.25,
    sanctions: 0.12,
    trade: 0.22,
    governance: 0.10,
    cyber: 0.15,
    unrest: 0.10,
    currency: 0.06,
  },
  'Mexico': {
    conflict: 0.18,
    sanctions: 0.10,
    trade: 0.20,
    governance: 0.18,
    cyber: 0.10,
    unrest: 0.14,
    currency: 0.10,
  },
  'Indonesia': {
    conflict: 0.15,
    sanctions: 0.10,
    trade: 0.20,
    governance: 0.20,
    cyber: 0.10,
    unrest: 0.15,
    currency: 0.10,
  },
  'Saudi Arabia': {
    conflict: 0.28,
    sanctions: 0.15,
    trade: 0.18,
    governance: 0.15,
    cyber: 0.10,
    unrest: 0.10,
    currency: 0.04,
  },
  'Turkey': {
    conflict: 0.22,
    sanctions: 0.15,
    trade: 0.18,
    governance: 0.15,
    cyber: 0.10,
    unrest: 0.12,
    currency: 0.08,
  },
  'Iran': {
    conflict: 0.25,
    sanctions: 0.40,
    trade: 0.15,
    governance: 0.10,
    cyber: 0.05,
    unrest: 0.03,
    currency: 0.02,
  },
  'Ukraine': {
    conflict: 0.50,
    sanctions: 0.15,
    trade: 0.15,
    governance: 0.10,
    cyber: 0.05,
    unrest: 0.03,
    currency: 0.02,
  },
  'Poland': {
    conflict: 0.20,
    sanctions: 0.10,
    trade: 0.22,
    governance: 0.12,
    cyber: 0.14,
    unrest: 0.12,
    currency: 0.10,
  },
  'Nigeria': {
    conflict: 0.30,
    sanctions: 0.10,
    trade: 0.15,
    governance: 0.25,
    cyber: 0.05,
    unrest: 0.10,
    currency: 0.05,
  },
  'Argentina': {
    conflict: 0.12,
    sanctions: 0.08,
    trade: 0.18,
    governance: 0.20,
    cyber: 0.08,
    unrest: 0.14,
    currency: 0.20,
  },
  'Vietnam': {
    conflict: 0.18,
    sanctions: 0.12,
    trade: 0.25,
    governance: 0.18,
    cyber: 0.10,
    unrest: 0.12,
    currency: 0.05,
  },
};

/**
 * Get CSI vector breakdown for a country
 * Returns default balanced distribution if country not found
 */
export function getCSIVectorBreakdown(country: string): CSIVectorBreakdown {
  return CSI_VECTOR_DATA[country] || {
    conflict: 0.22,
    sanctions: 0.18,
    trade: 0.16,
    governance: 0.14,
    cyber: 0.12,
    unrest: 0.10,
    currency: 0.08,
  };
}

/**
 * Get vector weight for a specific vector in a country
 */
export function getCountryVectorWeight(country: string, vector: string): number {
  const breakdown = getCSIVectorBreakdown(country);
  return breakdown[vector as keyof CSIVectorBreakdown] || 0;
}

/**
 * Validate that vector weights sum to approximately 1.0
 */
export function validateVectorWeights(country: string): boolean {
  const breakdown = getCSIVectorBreakdown(country);
  const sum = Object.values(breakdown).reduce((acc, val) => acc + val, 0);
  return Math.abs(sum - 1.0) < 0.01; // Allow 1% tolerance
}