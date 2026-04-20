/**
 * Sector Multipliers and Sensitivity Matrix
 * 
 * Contains CO-GRI sector sensitivity multipliers and sector-vector sensitivity matrix
 * used for dynamic sector exposure calculations.
 */

/**
 * CO-GRI Sector Sensitivity Multipliers
 * These represent the structural geopolitical sensitivity of each sector
 * Values remain constant globally
 */
export const SECTOR_SENSITIVITY: Record<string, number> = {
  'Energy & Resources': 1.45,
  'Financial Services': 1.30,
  'Manufacturing & Industry': 1.25,
  'Technology & Telecom': 1.35,
  'Trade & Logistics': 1.40,
  'Agriculture & Food': 1.15,
  'Healthcare & Pharma': 1.10,
  'Tourism & Services': 1.20,
  'Real Estate & Construction': 1.05,
  'Defense & Security': 1.50,
};

/**
 * Sector-Vector Sensitivity Matrix
 * Defines how sensitive each sector is to each of the 7 CSI risk vectors
 * 
 * Vectors:
 * - conflict: Conflict & Security (SC1)
 * - sanctions: Sanctions & Regulatory Pressure (SC2)
 * - trade: Trade & Logistics Disruption (SC3)
 * - governance: Governance & Rule of Law (SC4)
 * - cyber: Cyber & Data Sovereignty (SC5)
 * - unrest: Public Unrest & Labor Instability (SC6)
 * - currency: Currency & Capital Controls (SC7)
 * 
 * Values range from 0.5 (low sensitivity) to 2.0 (very high sensitivity)
 */
export const SECTOR_VECTOR_SENSITIVITY: Record<string, Record<string, number>> = {
  'Energy & Resources': {
    conflict: 2.0,      // Very high: Direct physical disruption to extraction/transport
    sanctions: 1.8,     // Very high: Export controls, embargoes
    trade: 1.5,         // High: Supply chain and logistics critical
    governance: 1.2,    // Moderate: Regulatory environment matters
    cyber: 1.0,         // Moderate: SCADA systems vulnerable
    unrest: 1.3,        // High: Labor strikes impact production
    currency: 1.1,      // Moderate: Commodity pricing effects
  },
  'Financial Services': {
    conflict: 0.8,      // Low-moderate: Indirect impact
    sanctions: 2.0,     // Very high: Direct blocking of transactions
    trade: 0.9,         // Low-moderate: Less trade-dependent
    governance: 1.8,    // Very high: Rule of law critical
    cyber: 1.9,         // Very high: Cybersecurity paramount
    unrest: 0.7,        // Low: Less labor-intensive
    currency: 1.9,      // Very high: FX and capital flow sensitive
  },
  'Manufacturing & Industry': {
    conflict: 1.4,      // High: Supply chain disruption
    sanctions: 1.5,     // High: Export controls on components
    trade: 2.0,         // Very high: Highly trade-dependent
    governance: 1.3,    // High: Regulatory compliance
    cyber: 1.2,         // Moderate-high: Industrial IoT risks
    unrest: 1.6,        // High: Labor-intensive
    currency: 1.4,      // High: Input cost sensitivity
  },
  'Technology & Telecom': {
    conflict: 1.0,      // Moderate: Infrastructure can be targeted
    sanctions: 1.9,     // Very high: Export controls, chip restrictions
    trade: 1.7,         // High: Global supply chains
    governance: 1.4,    // High: Data localization laws
    cyber: 2.0,         // Very high: Core business risk
    unrest: 0.9,        // Low-moderate: Less labor-intensive
    currency: 1.3,      // High: Global revenue exposure
  },
  'Trade & Logistics': {
    conflict: 1.7,      // High: Physical disruption to routes
    sanctions: 1.6,     // High: Restricted destinations
    trade: 2.0,         // Very high: Core business
    governance: 1.4,    // High: Customs and regulations
    cyber: 1.3,         // High: Digital systems critical
    unrest: 1.5,        // High: Port/transport strikes
    currency: 1.2,      // Moderate-high: FX transaction costs
  },
  'Agriculture & Food': {
    conflict: 1.5,      // High: Land use and displacement
    sanctions: 1.3,     // High: Export restrictions
    trade: 1.6,         // High: Global food supply chains
    governance: 1.1,    // Moderate: Land rights, subsidies
    cyber: 0.7,         // Low: Less digitized
    unrest: 1.4,        // High: Labor-intensive
    currency: 1.3,      // High: Commodity pricing
  },
  'Healthcare & Pharma': {
    conflict: 1.2,      // Moderate-high: Humanitarian impact
    sanctions: 1.4,     // High: Drug/equipment restrictions
    trade: 1.3,         // High: Global supply chains
    governance: 1.5,    // High: Regulatory approval critical
    cyber: 1.4,         // High: Patient data and systems
    unrest: 1.1,        // Moderate: Healthcare worker strikes
    currency: 1.2,      // Moderate-high: Import costs
  },
  'Tourism & Services': {
    conflict: 1.8,      // Very high: Travel advisories
    sanctions: 1.1,     // Moderate: Payment restrictions
    trade: 1.0,         // Moderate: Less trade-dependent
    governance: 1.2,    // Moderate-high: Visa policies
    cyber: 1.1,         // Moderate: Booking systems
    unrest: 1.7,        // High: Social stability critical
    currency: 1.5,      // High: Exchange rate sensitive
  },
  'Real Estate & Construction': {
    conflict: 1.6,      // High: Physical destruction risk
    sanctions: 1.2,     // Moderate-high: Financing restrictions
    trade: 1.1,         // Moderate: Material imports
    governance: 1.6,    // High: Property rights, zoning
    cyber: 0.6,         // Low: Less digitized
    unrest: 1.4,        // High: Labor-intensive
    currency: 1.5,      // High: Financing and investment flows
  },
  'Defense & Security': {
    conflict: 2.0,      // Very high: Direct involvement
    sanctions: 1.9,     // Very high: Arms embargoes
    trade: 1.5,         // High: Defense supply chains
    governance: 1.7,    // High: Military-civil relations
    cyber: 1.8,         // Very high: Warfare domain
    unrest: 1.6,        // High: Domestic security threats
    currency: 1.0,      // Moderate: Government-funded
  },
};

/**
 * Strategic importance weights for sectors (0-1 scale)
 * Used in CountrySectorImportance calculation when specific data unavailable
 * Represents policy/strategic significance beyond economic metrics
 */
export const STRATEGIC_IMPORTANCE: Record<string, number> = {
  'Energy & Resources': 0.95,
  'Financial Services': 0.85,
  'Manufacturing & Industry': 0.80,
  'Technology & Telecom': 0.90,
  'Trade & Logistics': 0.75,
  'Agriculture & Food': 0.85,
  'Healthcare & Pharma': 0.90,
  'Tourism & Services': 0.60,
  'Real Estate & Construction': 0.65,
  'Defense & Security': 1.00,
};

/**
 * Get sector sensitivity multiplier
 */
export function getSectorSensitivity(sector: string): number {
  return SECTOR_SENSITIVITY[sector] || 1.0;
}

/**
 * Get sector-vector sensitivity
 */
export function getSectorVectorSensitivity(sector: string, vector: string): number {
  return SECTOR_VECTOR_SENSITIVITY[sector]?.[vector] || 1.0;
}

/**
 * Get strategic importance for a sector
 */
export function getStrategicImportance(sector: string): number {
  return STRATEGIC_IMPORTANCE[sector] || 0.75;
}

/**
 * List of all sectors
 */
export const ALL_SECTORS = Object.keys(SECTOR_SENSITIVITY);

/**
 * List of all vectors
 */
export const ALL_VECTORS = ['conflict', 'sanctions', 'trade', 'governance', 'cyber', 'unrest', 'currency'];