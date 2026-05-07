import { getCountryShockIndex, GLOBAL_COUNTRIES } from '@/data/globalCountries';
import { getCompanyGeographicExposure } from './geographicExposureService';

/**
 * Scenario Engine for Predictive Analytics - ENHANCED REGIONAL vs GLOBAL DISTINCTION
 * 
 * REGIONAL vs GLOBAL PROPAGATION MODES (ENHANCED):
 * 
 * REGIONAL MODE:
 * - Purpose: Identify material, first-order spillovers
 * - Inclusion: Countries with material exposure to target (filtered)
 * - Criteria: Top-N trade partners, ≥X% trade intensity, supply chain, financial linkage
 * - Output: ~20-40 countries with significant exposure
 * - Use case: Near-term risk, realistic contagion, second-order effects
 * 
 * GLOBAL MODE:
 * - Purpose: Measure full spillover distribution including long-tail effects
 * - Inclusion: All countries where exposure can be computed (unfiltered)
 * - Criteria: Any measurable trade, supply chain, or financial linkage
 * - Output: ~150-195 countries with smooth decay pattern
 * - Use case: Portfolio risk, tail risk, concentration analysis
 * 
 * KEY PRINCIPLE:
 * Regional ⊂ Global (Regional is strict subset of Global)
 * Same propagation formulas, different inclusion criteria
 * Display threshold can filter noise without affecting calculation
 * 
 * CORRECTED REGIONAL COUNTRY INCLUSION METHODOLOGY:
 * A country c is included in Regional propagation set ONLY if it has MATERIAL EXPOSURE to target T:
 * 
 * Material exposure demonstrated by:
 * 1. Trade linkage: Top N partners OR ≥ X% of T's total trade
 * 2. Supply-chain linkage: Top supply-chain partner for relevant sectors  
 * 3. Financial/energy linkage: Material financial, energy, or capital-market exposure
 * 4. Geographic region: Secondary supporting criterion (not sufficient alone)
 * 
 * SPILLOVER CALCULATION:
 * EventImpact_c = Severity × EventBaseShock × PropagationWeight_c
 * Where PropagationWeight_c = α·Trade(c↔T) + β·SupplyChain(c↔T) + γ·Financial(c↔T)
 * 
 * FALLBACK METHOD:
 * For target countries without trade data, uses geographic proximity + CSI similarity
 * 
 * PHASE 2 DATA SOURCES:
 * - Brazil: World Bank WITS 2023 data
 * - Russia: IMF DOTS 2021 data
 * - India: Government of India FY 2023-24 data
 * - South Africa: UN Comtrade 2023 data
 * - Canada, Mexico, South Korea, Australia: OECD Trade Statistics 2023
 * - Spain, Netherlands, Switzerland: Eurostat 2024 data
 * - Saudi Arabia, Turkey, Indonesia: National statistics agencies 2023
 * 
 * GLOBAL MODE ENHANCEMENT:
 * Global mode now properly distinguishes from Regional by showing all computed exposures,
 * including minimal spillovers, providing smooth decay pattern instead of binary inclusion.
 * 
 * MATHEMATICAL BREAKDOWN ENHANCEMENT:
 * Added comprehensive mathematical breakdown display for complete transparency on all
 * scenario-level and country-level parameters including severity scalars, event base shocks,
 * raw channel exposures, weighted components, and pre/post-rounded CSI changes.
 */

export interface ScenarioConfig {
  eventType: string;
  customEventName?: string;
  actorCountry: string;
  targetCountries: string[];
  propagationType: 'unilateral' | 'bilateral' | 'regional' | 'global';
  severity: 'low' | 'medium' | 'high';
  applyAlignmentChanges: boolean;
  applyExposureChanges: boolean;
  applySectorSensitivity: boolean;
  displayThreshold?: number;  // NEW: Minimum ΔCSI to display (optional, default: 0 for Regional, 0.05 for Global)
  applyTo: {
    type: 'entire' | 'sectors' | 'countries' | 'company';
    sectors?: string[];
    countries?: string[];
    company?: string;
  };
}
