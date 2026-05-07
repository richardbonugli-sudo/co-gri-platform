/**
 * Forecast Engine - Enhanced Implementation
 * 
 * Generates baseline forecast events for 6-12 month outlook with:
 * - Event probability assignment (0-1 range)
 * - Expected-path delta calculations (ΔCO-GRI)
 * - Channel-level impact breakdown
 * - Country node attribution
 * - Relevance filtering with guardrails
 * 
 * Part of CO-GRI Platform Phase 2 Implementation
 */

export interface ForecastEvent {
  event_id: string;
  event_name: string;
  event_type: 'Trade' | 'Military' | 'Sanctions' | 'Supply Chain' | 'Policy' | 'Economic';
  probability: number; // 0-1 range
  expected_date: string; // ISO date string
  duration_months: number;
  
  // Geographic scope
  top_country_nodes: string[]; // Countries most affected
  actor_countries?: string[]; // Countries initiating the event
  
  // Impact metrics
  expected_delta_CO_GRI: number; // Overall expected change
  delta_by_channel: {
    revenue: number;
    supply_chain: number;
    physical_assets: number;
    financial: number;
  };
  
  // Metadata
  description: string;
  confidence: number; // 0-1 range
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  outlook: string; // Brief outlook statement
}

export interface CompanyExposure {
  ticker: string;
  name: string;
  sector: string;
  exposures: Record<string, {
    W_R: number;  // Revenue weight
    W_S: number;  // Supply chain weight
    W_P: number;  // Physical assets weight
    W_F: number;  // Financial weight
    CSI: number;  // Country Shock Index
  }>;
}

export interface ForecastImpactResult {
  company_ticker: string;
  forecast_event_id: string;
  expected_delta_CO_GRI: number;
  probability_weighted_delta: number;
  affected_countries: string[];
  channel_breakdown: {
    revenue: number;
    supply_chain: number;
    physical_assets: number;
    financial: number;
  };
  confidence: number;
}

/**
 * Filter forecast events relevant to a company
 * 
 * Relevance criteria:
 * 1. Event affects countries where company has exposure (>5% threshold)
 * 2. Expected ΔCO-GRI > threshold (±2)
 * 
 * @param company - Company exposure data
 * @param allForecastEvents - All available forecast events
 * @returns Filtered array of relevant forecast events
 */
export function filterRelevantForecastEvents(
  company: CompanyExposure,
  allForecastEvents: ForecastEvent[]
): ForecastEvent[] {
  return allForecastEvents.filter(event => {
    // 1. Event affects countries where company has exposure
    const hasExposure = event.top_country_nodes.some(country => {
      const exposure = company.exposures[country];
      if (!exposure) return false;
      
      // Check if any channel has >5% exposure
      const totalWeight = exposure.W_R + exposure.W_S + exposure.W_P + exposure.W_F;
      return totalWeight > 0.05;
    });
    
    // 2. Expected ΔCO-GRI > threshold (±2)
    const significantImpact = Math.abs(event.expected_delta_CO_GRI) > 2;
    
    return hasExposure && significantImpact;
  });
}

/**
 * Apply forecast event to company with CRITICAL GUARDRAILS
 * 
 * GUARDRAILS ENFORCED:
 * 1. ONLY apply if company already has exposure to the country
 * 2. DO NOT change exposure weights (W_R, W_S, W_P, W_F)
 * 3. DO NOT create new country exposures
 * 4. Apply forecast delta to existing shock intensity only
 * 
 * @param company - Company exposure data
 * @param forecastEvent - Forecast event to apply
 * @returns Calculated ΔCO-GRI impact
 */
export function applyForecastToCompany(
  company: CompanyExposure,
  forecastEvent: ForecastEvent
): ForecastImpactResult {
  let delta_CO_GRI = 0;
  const affectedCountries: string[] = [];
  const channelBreakdown = {
    revenue: 0,
    supply_chain: 0,
    physical_assets: 0,
    financial: 0
  };
  
  for (const country of forecastEvent.top_country_nodes) {
    // GUARDRAIL: ONLY apply if company already has exposure to this country
    if (!company.exposures[country]) continue;
    
    const existingExposure = company.exposures[country];
    
    // Apply forecast delta to existing shock intensity
    // DO NOT change exposure weights (GUARDRAIL)
    const forecastDelta = forecastEvent.delta_by_channel;
    
    // Calculate weighted impact for this country
    const countryImpact = (
      existingExposure.W_R * forecastDelta.revenue +
      existingExposure.W_S * forecastDelta.supply_chain +
      existingExposure.W_P * forecastDelta.physical_assets +
      existingExposure.W_F * forecastDelta.financial
    );
    
    delta_CO_GRI += countryImpact;
    affectedCountries.push(country);
    
    // Track channel-level breakdown
    channelBreakdown.revenue += existingExposure.W_R * forecastDelta.revenue;
    channelBreakdown.supply_chain += existingExposure.W_S * forecastDelta.supply_chain;
    channelBreakdown.physical_assets += existingExposure.W_P * forecastDelta.physical_assets;
    channelBreakdown.financial += existingExposure.W_F * forecastDelta.financial;
  }
  
  return {
    company_ticker: company.ticker,
    forecast_event_id: forecastEvent.event_id,
    expected_delta_CO_GRI: delta_CO_GRI,
    probability_weighted_delta: delta_CO_GRI * forecastEvent.probability,
    affected_countries: affectedCountries,
    channel_breakdown: channelBreakdown,
    confidence: forecastEvent.confidence
  };
}

/**
 * Generate baseline forecast events for 6-12 month outlook
 * 
 * @returns Array of forecast events
 */
export function generateBaselineForecastEvents(): ForecastEvent[] {
  const today = new Date();
  
  return [
    {
      event_id: 'fcst_2026_001',
      event_name: 'US-China Trade War Escalation',
      event_type: 'Trade',
      probability: 0.70,
      expected_date: new Date(today.getFullYear(), today.getMonth() + 3, 15).toISOString(), // Q2 2026
      duration_months: 6,
      top_country_nodes: ['United States', 'China', 'Taiwan', 'South Korea', 'Vietnam'],
      actor_countries: ['United States', 'China'],
      expected_delta_CO_GRI: 8.5,
      delta_by_channel: {
        revenue: 3.2,
        supply_chain: 4.1,
        physical_assets: 0.8,
        financial: 0.4
      },
      description: 'Escalating trade tensions with new tariffs on semiconductors, electronics, and advanced manufacturing. Expected to disrupt supply chains across Asia-Pacific region.',
      confidence: 0.75,
      severity: 'High',
      outlook: 'Rising protectionism likely to increase costs and supply chain complexity'
    },
    {
      event_id: 'fcst_2026_002',
      event_name: 'Taiwan Strait Military Tensions',
      event_type: 'Military',
      probability: 0.40,
      expected_date: new Date(today.getFullYear(), today.getMonth() + 6, 1).toISOString(), // Q3 2026
      duration_months: 4,
      top_country_nodes: ['Taiwan', 'China', 'Japan', 'South Korea', 'United States'],
      actor_countries: ['China', 'Taiwan'],
      expected_delta_CO_GRI: 12.3,
      delta_by_channel: {
        revenue: 2.8,
        supply_chain: 6.5,
        physical_assets: 2.1,
        financial: 0.9
      },
      description: 'Increased military exercises and tensions in Taiwan Strait raising concerns about semiconductor supply chain disruptions and regional stability.',
      confidence: 0.65,
      severity: 'Critical',
      outlook: 'Semiconductor supply chain at risk; companies diversifying manufacturing away from Taiwan'
    },
    {
      event_id: 'fcst_2026_003',
      event_name: 'Middle East Oil Supply Disruption',
      event_type: 'Supply Chain',
      probability: 0.30,
      expected_date: new Date(today.getFullYear(), today.getMonth() + 4, 1).toISOString(), // Q2-Q3 2026
      duration_months: 3,
      top_country_nodes: ['Saudi Arabia', 'Iran', 'United Arab Emirates', 'Iraq', 'Kuwait'],
      actor_countries: ['Iran'],
      expected_delta_CO_GRI: 6.8,
      delta_by_channel: {
        revenue: 1.5,
        supply_chain: 3.2,
        physical_assets: 1.8,
        financial: 0.3
      },
      description: 'Regional tensions threaten oil supply routes through Strait of Hormuz, affecting global energy markets and logistics operations.',
      confidence: 0.58,
      severity: 'High',
      outlook: 'Energy price volatility expected; transportation and manufacturing costs likely to rise'
    },
    {
      event_id: 'fcst_2026_004',
      event_name: 'EU-Russia Energy Crisis Intensification',
      event_type: 'Sanctions',
      probability: 0.50,
      expected_date: new Date(today.getFullYear(), today.getMonth() + 2, 15).toISOString(), // Q2 2026
      duration_months: 8,
      top_country_nodes: ['Russia', 'Germany', 'Poland', 'France', 'Italy'],
      actor_countries: ['European Union', 'Russia'],
      expected_delta_CO_GRI: 5.4,
      delta_by_channel: {
        revenue: 1.8,
        supply_chain: 2.1,
        physical_assets: 0.9,
        financial: 0.6
      },
      description: 'Extended sanctions on Russian energy sector creating supply constraints and price volatility across European markets.',
      confidence: 0.72,
      severity: 'Medium',
      outlook: 'European manufacturing facing higher energy costs; shift toward alternative suppliers accelerating'
    },
    {
      event_id: 'fcst_2026_005',
      event_name: 'India-China Border Tensions',
      event_type: 'Military',
      probability: 0.25,
      expected_date: new Date(today.getFullYear(), today.getMonth() + 7, 1).toISOString(), // Q3 2026
      duration_months: 3,
      top_country_nodes: ['India', 'China', 'Pakistan', 'Nepal'],
      actor_countries: ['India', 'China'],
      expected_delta_CO_GRI: 4.2,
      delta_by_channel: {
        revenue: 1.2,
        supply_chain: 1.8,
        physical_assets: 0.9,
        financial: 0.3
      },
      description: 'Border disputes in Himalayan region creating uncertainty for companies with operations in South Asia.',
      confidence: 0.55,
      severity: 'Medium',
      outlook: 'Regional trade flows may be disrupted; companies monitoring situation closely'
    },
    {
      event_id: 'fcst_2026_006',
      event_name: 'Brazil Political Instability',
      event_type: 'Policy',
      probability: 0.45,
      expected_date: new Date(today.getFullYear(), today.getMonth() + 5, 1).toISOString(), // Q3 2026
      duration_months: 5,
      top_country_nodes: ['Brazil', 'Argentina', 'Chile', 'Colombia'],
      actor_countries: ['Brazil'],
      expected_delta_CO_GRI: 3.8,
      delta_by_channel: {
        revenue: 1.5,
        supply_chain: 1.1,
        physical_assets: 0.8,
        financial: 0.4
      },
      description: 'Political uncertainty and policy shifts affecting business environment and investment climate in Latin America.',
      confidence: 0.62,
      severity: 'Medium',
      outlook: 'Regulatory changes expected; companies adjusting investment strategies'
    },
    {
      event_id: 'fcst_2026_007',
      event_name: 'Southeast Asia Supply Chain Shift',
      event_type: 'Supply Chain',
      probability: 0.65,
      expected_date: new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString(), // Q2 2026
      duration_months: 12,
      top_country_nodes: ['Vietnam', 'Thailand', 'Indonesia', 'Malaysia', 'Philippines'],
      actor_countries: ['Vietnam', 'Thailand'],
      expected_delta_CO_GRI: -2.5, // Negative = risk reduction
      delta_by_channel: {
        revenue: -0.8,
        supply_chain: -1.2,
        physical_assets: -0.3,
        financial: -0.2
      },
      description: 'Accelerated manufacturing diversification from China to Southeast Asia reducing concentration risk.',
      confidence: 0.78,
      severity: 'Low',
      outlook: 'Supply chain resilience improving; geographic diversification reducing single-country dependencies'
    },
    {
      event_id: 'fcst_2026_008',
      event_name: 'Global Semiconductor Capacity Expansion',
      event_type: 'Supply Chain',
      probability: 0.80,
      expected_date: new Date(today.getFullYear(), today.getMonth() + 8, 1).toISOString(), // Q4 2026
      duration_months: 6,
      top_country_nodes: ['United States', 'Japan', 'South Korea', 'Germany'],
      actor_countries: ['United States', 'Japan'],
      expected_delta_CO_GRI: -3.2, // Negative = risk reduction
      delta_by_channel: {
        revenue: -0.9,
        supply_chain: -1.8,
        physical_assets: -0.3,
        financial: -0.2
      },
      description: 'New semiconductor fabrication facilities coming online in US, Japan, and Europe reducing supply chain vulnerabilities.',
      confidence: 0.82,
      severity: 'Low',
      outlook: 'Semiconductor supply constraints easing; geographic diversification of production reducing Taiwan dependency'
    }
  ];
}

/**
 * Calculate aggregate forecast impact for a company across all relevant events
 * 
 * @param company - Company exposure data
 * @param forecastEvents - Array of forecast events (if not provided, uses baseline)
 * @returns Array of forecast impact results
 */
export function calculateCompanyForecastImpact(
  company: CompanyExposure,
  forecastEvents?: ForecastEvent[]
): ForecastImpactResult[] {
  const events = forecastEvents || generateBaselineForecastEvents();
  const relevantEvents = filterRelevantForecastEvents(company, events);
  
  return relevantEvents.map(event => applyForecastToCompany(company, event));
}

// Export singleton instance for convenience
class ForecastEngineService {
  private baselineEvents: ForecastEvent[];
  
  constructor() {
    this.baselineEvents = generateBaselineForecastEvents();
  }
  
  getBaselineEvents(): ForecastEvent[] {
    return this.baselineEvents;
  }
  
  getRelevantEvents(company: CompanyExposure): ForecastEvent[] {
    return filterRelevantForecastEvents(company, this.baselineEvents);
  }
  
  calculateImpact(company: CompanyExposure): ForecastImpactResult[] {
    return calculateCompanyForecastImpact(company, this.baselineEvents);
  }
}

export const forecastEngineService = new ForecastEngineService();