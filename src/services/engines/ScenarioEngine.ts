/**
 * Scenario Engine
 * Executes geopolitical shock scenarios and calculates company impacts
 * Part of CO-GRI Platform Phase 3 - Weeks 9-10
 */

import {
  Scenario,
  ScenarioResult,
  GlobalImpact,
  RegionalImpact,
  SectorImpact,
  CompanyImpact,
  TransmissionGraph,
  TransmissionNode,
  TransmissionEdge,
  ImpactLevel
} from '@/types/scenario';
import { CountryExposure } from '@/services/cogriCalculationService';
import { getCompanyGeographicExposure } from '@/services/geographicExposureService';

/**
 * Main scenario execution function
 */
export async function runScenario(scenario: Scenario): Promise<ScenarioResult> {
  const startTime = Date.now();

  // Step 1: Apply initial shock
  const initialShockNodes = applyInitialShock(scenario);

  // Step 2: Propagate shock through network
  const transmissionGraph = await propagateShock(scenario, initialShockNodes);

  // Step 3: Calculate company impacts
  const companyImpacts = await calculateCompanyImpacts(scenario, transmissionGraph);

  // Step 4: Aggregate results
  const globalImpact = calculateGlobalImpact(companyImpacts);
  const regionalImpacts = calculateRegionalImpacts(companyImpacts);
  const sectorImpacts = calculateSectorImpacts(companyImpacts);

  const executionTime = Date.now() - startTime;

  return {
    scenario,
    execution_time_ms: executionTime,
    global_impact: globalImpact,
    regional_impacts: regionalImpacts,
    sector_impacts: sectorImpacts,
    company_impacts: companyImpacts,
    transmission_graph: transmissionGraph,
    generated_at: new Date()
  };
}

/**
 * Apply initial shock to affected countries
 */
function applyInitialShock(scenario: Scenario): TransmissionNode[] {
  const nodes: TransmissionNode[] = [];

  scenario.initial_shock.affected_countries.forEach(country => {
    nodes.push({
      node_id: `country_${country}`,
      node_type: 'Country',
      node_layer: 0,
      label: country,
      shock_intensity: scenario.initial_shock.shock_intensity,
      is_initial_shock: true,
      is_amplified: false,
      metadata: { country }
    });
  });

  return nodes;
}

/**
 * Propagate shock through network layers
 */
async function propagateShock(
  scenario: Scenario,
  initialNodes: TransmissionNode[]
): Promise<TransmissionGraph> {
  const nodes: TransmissionNode[] = [...initialNodes];
  const edges: TransmissionEdge[] = [];

  const { propagation_depth, amplification_factor, sector_filters } = scenario.propagation_settings;

  // Layer 1: Propagate to sectors
  const affectedSectors = sector_filters.length > 0 ? sector_filters : [
    'Technology', 'Finance', 'Healthcare', 'Energy', 'Industrials',
    'Consumer Discretionary', 'Consumer Staples', 'Materials'
  ];

  affectedSectors.forEach(sector => {
    const sectorShock = calculatePropagatedShock(
      scenario.initial_shock.shock_intensity,
      amplification_factor,
      1
    );

    nodes.push({
      node_id: `sector_${sector}`,
      node_type: 'Sector',
      node_layer: 1,
      label: sector,
      shock_intensity: sectorShock,
      is_initial_shock: false,
      is_amplified: sectorShock > scenario.initial_shock.shock_intensity,
      amplification_factor: sectorShock > scenario.initial_shock.shock_intensity ? amplification_factor : undefined,
      metadata: { sector }
    });

    // Create edges from countries to sectors
    initialNodes.forEach(countryNode => {
      edges.push({
        source_node_id: countryNode.node_id,
        target_node_id: `sector_${sector}`,
        transmission_intensity: sectorShock,
        transmission_channel: 'Supply Chain',
        attenuation_factor: sectorShock / scenario.initial_shock.shock_intensity
      });
    });
  });

  return {
    nodes,
    edges,
    max_layer: Math.min(propagation_depth, 2) as any,
    total_nodes: nodes.length,
    total_edges: edges.length
  };
}

/**
 * Calculate propagated shock intensity
 */
function calculatePropagatedShock(
  baseShock: number,
  amplificationFactor: number,
  layer: number
): number {
  // Apply amplification/dampening and distance decay
  const distanceDecay = Math.pow(0.8, layer);
  return baseShock * amplificationFactor * distanceDecay;
}

/**
 * Calculate company impacts
 */
async function calculateCompanyImpacts(
  scenario: Scenario,
  transmissionGraph: TransmissionGraph
): Promise<CompanyImpact[]> {
  const impacts: CompanyImpact[] = [];

  // Sample companies to analyze
  const sampleTickers = ['AAPL', 'NVDA', 'TSLA', 'INTC', 'MSFT', 'GOOGL', 'AMZN', 'META'];

  for (const ticker of sampleTickers) {
    try {
      const geoData = await getCompanyGeographicExposure(ticker);
      if (!geoData) continue;

      const impact = calculateSingleCompanyImpact(
        ticker,
        geoData,
        scenario,
        transmissionGraph
      );

      // Apply filters
      const { threshold_delta_CO_GRI, specific_tickers } = scenario.propagation_settings.company_filters;

      if (threshold_delta_CO_GRI && Math.abs(impact.scenario_delta_CO_GRI) < threshold_delta_CO_GRI) {
        continue;
      }

      if (specific_tickers && specific_tickers.length > 0 && !specific_tickers.includes(ticker)) {
        continue;
      }

      impacts.push(impact);
    } catch (error) {
      console.error(`Error calculating impact for ${ticker}:`, error);
    }
  }

  return impacts.sort((a, b) => Math.abs(b.scenario_delta_CO_GRI) - Math.abs(a.scenario_delta_CO_GRI));
}

/**
 * Calculate impact for a single company
 */
function calculateSingleCompanyImpact(
  ticker: string,
  geoData: any,
  scenario: Scenario,
  transmissionGraph: TransmissionGraph
): CompanyImpact {
  const baselineCOGRI = 50; // Placeholder
  let totalDelta: number;
  const channelBreakdown = {
    revenue: 0,
    supply_chain: 0,
    physical_assets: 0,
    financial: 0
  };

  // Calculate exposure overlap with shocked countries
  const affectedCountries = scenario.initial_shock.affected_countries;
  const companyExposure = geoData.segments || [];

  companyExposure.forEach((segment: any) => {
    if (affectedCountries.includes(segment.country)) {
      const exposureWeight = segment.revenue_percentage / 100;
      const shockIntensity = scenario.initial_shock.shock_intensity;

      // Apply channel-specific impacts
      const channelDist = scenario.initial_shock.channel_distribution;
      channelBreakdown.revenue += (shockIntensity * channelDist.revenue / 100) * exposureWeight;
      channelBreakdown.supply_chain += (shockIntensity * channelDist.supply_chain / 100) * exposureWeight;
      channelBreakdown.physical_assets += (shockIntensity * channelDist.physical_assets / 100) * exposureWeight;
      channelBreakdown.financial += (shockIntensity * channelDist.financial / 100) * exposureWeight;
    }
  });

  totalDelta = 
    channelBreakdown.revenue +
    channelBreakdown.supply_chain +
    channelBreakdown.physical_assets +
    channelBreakdown.financial;

  // Determine transmission path
  const transmissionPath = traceTransmissionPath(ticker, affectedCountries, geoData.sector || 'Technology');
  const transmissionPathLength = transmissionPath.length;

  return {
    ticker,
    company_name: `${ticker} Corporation`,
    sector: geoData.sector || 'Technology',
    baseline_CO_GRI: baselineCOGRI,
    scenario_delta_CO_GRI: totalDelta,
    new_CO_GRI: baselineCOGRI + totalDelta,
    impact_level: getImpactLevel(totalDelta),
    transmission_path_length: transmissionPathLength,
    transmission_path: transmissionPath,
    channel_breakdown: channelBreakdown,
    recovery_time_estimate_months: estimateRecoveryTime(totalDelta, scenario.initial_shock.duration_months)
  };
}

/**
 * Trace transmission path for a company
 */
function traceTransmissionPath(ticker: string, affectedCountries: string[], sector: string): string[] {
  const path: string[] = [];

  if (affectedCountries.length > 0) {
    path.push(affectedCountries[0]); // Primary affected country
  }

  path.push(`${sector} Sector`);
  path.push(`${ticker} Corporation`);

  return path;
}

/**
 * Estimate recovery time based on impact
 */
function estimateRecoveryTime(deltaCOGRI: number, shockDuration: number): number {
  const absDelta = Math.abs(deltaCOGRI);
  const baseRecovery = shockDuration * 1.5;

  if (absDelta >= 10) return Math.ceil(baseRecovery * 2);
  if (absDelta >= 7) return Math.ceil(baseRecovery * 1.5);
  if (absDelta >= 4) return Math.ceil(baseRecovery);
  return Math.ceil(baseRecovery * 0.5);
}

/**
 * Calculate global impact metrics
 */
function calculateGlobalImpact(companyImpacts: CompanyImpact[]): GlobalImpact {
  if (companyImpacts.length === 0) {
    return {
      total_countries_affected: 0,
      total_companies_affected: 0,
      average_delta_CO_GRI: 0,
      max_delta_CO_GRI: 0,
      min_delta_CO_GRI: 0
    };
  }

  const deltas = companyImpacts.map(c => c.scenario_delta_CO_GRI);
  const uniqueCountries = new Set<string>();

  companyImpacts.forEach(impact => {
    impact.transmission_path.forEach(node => {
      if (!node.includes('Sector') && !node.includes('Corporation')) {
        uniqueCountries.add(node);
      }
    });
  });

  return {
    total_countries_affected: uniqueCountries.size,
    total_companies_affected: companyImpacts.length,
    average_delta_CO_GRI: deltas.reduce((sum, d) => sum + d, 0) / deltas.length,
    max_delta_CO_GRI: Math.max(...deltas),
    min_delta_CO_GRI: Math.min(...deltas),
    total_economic_impact_estimate: deltas.reduce((sum, d) => sum + Math.abs(d), 0) * 10
  };
}

/**
 * Calculate regional impacts
 */
function calculateRegionalImpacts(companyImpacts: CompanyImpact[]): RegionalImpact[] {
  const regionMap = new Map<string, CompanyImpact[]>();

  companyImpacts.forEach(impact => {
    const region = getRegionFromPath(impact.transmission_path);
    if (!regionMap.has(region)) {
      regionMap.set(region, []);
    }
    regionMap.get(region)!.push(impact);
  });

  const regionalImpacts: RegionalImpact[] = [];

  regionMap.forEach((impacts, region) => {
    const avgDelta = impacts.reduce((sum, i) => sum + i.scenario_delta_CO_GRI, 0) / impacts.length;
    const countries = new Set<string>();

    impacts.forEach(impact => {
      impact.transmission_path.forEach(node => {
        if (!node.includes('Sector') && !node.includes('Corporation')) {
          countries.add(node);
        }
      });
    });

    regionalImpacts.push({
      region,
      countries_affected: Array.from(countries),
      average_delta_CO_GRI: avgDelta,
      companies_affected: impacts.length,
      primary_transmission_channels: ['Supply Chain', 'Revenue']
    });
  });

  return regionalImpacts;
}

/**
 * Calculate sector impacts
 */
function calculateSectorImpacts(companyImpacts: CompanyImpact[]): SectorImpact[] {
  const sectorMap = new Map<string, CompanyImpact[]>();

  companyImpacts.forEach(impact => {
    if (!sectorMap.has(impact.sector)) {
      sectorMap.set(impact.sector, []);
    }
    sectorMap.get(impact.sector)!.push(impact);
  });

  const sectorImpacts: SectorImpact[] = [];

  sectorMap.forEach((impacts, sector) => {
    const avgDelta = impacts.reduce((sum, i) => sum + i.scenario_delta_CO_GRI, 0) / impacts.length;
    const topCompanies = impacts
      .sort((a, b) => Math.abs(b.scenario_delta_CO_GRI) - Math.abs(a.scenario_delta_CO_GRI))
      .slice(0, 5)
      .map(i => i.ticker);

    sectorImpacts.push({
      sector,
      average_delta_CO_GRI: avgDelta,
      companies_affected: impacts.length,
      most_affected_companies: topCompanies,
      primary_transmission_channels: ['Supply Chain', 'Revenue']
    });
  });

  return sectorImpacts.sort((a, b) => Math.abs(b.average_delta_CO_GRI) - Math.abs(a.average_delta_CO_GRI));
}

/**
 * Get region from transmission path
 */
function getRegionFromPath(path: string[]): string {
  const countryRegionMap: Record<string, string> = {
    'China': 'East Asia',
    'Taiwan': 'East Asia',
    'Japan': 'East Asia',
    'S. Korea': 'East Asia',
    'United States': 'North America',
    'Germany': 'Europe',
    'France': 'Europe',
    'UK': 'Europe'
  };

  for (const node of path) {
    if (countryRegionMap[node]) {
      return countryRegionMap[node];
    }
  }

  return 'Global';
}

/**
 * Determine impact level from delta CO-GRI
 */
function getImpactLevel(deltaCOGRI: number): ImpactLevel {
  const absDelta = Math.abs(deltaCOGRI);
  if (absDelta >= 10) return 'Critical';
  if (absDelta >= 7) return 'High';
  if (absDelta >= 4) return 'Medium';
  if (absDelta >= 2) return 'Low';
  return 'Negligible';
}

// ─────────────────────────────────────────────────────────────────────────────
// ScenarioEngineService – synchronous, self-contained service used by tests
// ─────────────────────────────────────────────────────────────────────────────

export type EventType = 'Trade' | 'Military' | 'Policy' | 'Natural' | 'Cyber' | 'Sanctions';
export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ScenarioParameters {
  name: string;
  description: string;
  event_type: EventType;
  severity: SeverityLevel;
  probability: number;         // 0–1
  duration_months: number;     // >= 1
  affected_countries: string[];
  affected_channels: string[]; // e.g. 'Revenue', 'Supply', 'Assets', 'Financial'
  tags?: string[];
}

export interface ScenarioRecord extends ScenarioParameters {
  scenario_id: string;
  is_active: boolean;
  created_date: Date;
  updated_date: Date;
}

export interface CountrySegment {
  country: string;
  exposureWeight: number; // 0–1
  countryRisk: number;    // 0–100
}

export interface ChannelBreakdown {
  revenue: number;
  supply_chain: number;
  physical_assets: number;
  financial: number;
}

export interface CompanyExposure {
  ticker: string;
  name: string;
  sector: string;
  home_country: string;
  cogri_score: number;
  segments: CountrySegment[];
  channel_breakdown: ChannelBreakdown;
}

export interface CountryImpact {
  country: string;
  delta_contribution: number;
}

export interface TimelinePoint {
  month: number;
  cumulative_delta: number;
}

export interface ScenarioApplyResult {
  scenario_id: string;
  company_ticker: string;
  delta_CO_GRI: number;
  probability_weighted_delta: number;
  channel_impacts: ChannelBreakdown;
  country_impacts: CountryImpact[];
  timeline: TimelinePoint[];
}

export interface ScenarioValidation {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ScenarioComparison {
  scenarios: Array<ScenarioRecord & { risk_rank: number; delta_CO_GRI: number }>;
  best_case_scenario_id: string;
  worst_case_scenario_id: string;
  average_delta: number;
}

/** Severity → base impact multiplier */
const SEVERITY_MULTIPLIERS: Record<SeverityLevel, number> = {
  Low: 1.0,
  Medium: 2.5,
  High: 5.0,
  Critical: 10.0,
};

/** Channel name aliases used in affected_channels → ChannelBreakdown keys */
const CHANNEL_ALIASES: Record<string, keyof ChannelBreakdown> = {
  revenue: 'revenue',
  Revenue: 'revenue',
  supply: 'supply_chain',
  Supply: 'supply_chain',
  supply_chain: 'supply_chain',
  assets: 'physical_assets',
  Assets: 'physical_assets',
  physical_assets: 'physical_assets',
  financial: 'financial',
  Financial: 'financial',
};

class ScenarioEngineService {
  private scenarios = new Map<string, ScenarioRecord>();
  private counter = 0;

  // ── CRUD ──────────────────────────────────────────────────────────────────

  createScenario(params: ScenarioParameters): ScenarioRecord {
    // Validation
    if (!params.name || params.name.trim() === '') {
      throw new Error('Scenario name must not be empty');
    }
    if (params.probability < 0 || params.probability > 1) {
      throw new Error('probability must be between 0 and 1');
    }
    if (params.duration_months < 1) {
      throw new Error('duration_months must be >= 1');
    }
    if (!params.affected_countries || params.affected_countries.length === 0) {
      throw new Error('affected_countries must not be empty');
    }
    if (!params.affected_channels || params.affected_channels.length === 0) {
      throw new Error('affected_channels must not be empty');
    }

    const id = `scenario_${++this.counter}_${Date.now()}`;
    const now = new Date();
    const record: ScenarioRecord = {
      ...params,
      scenario_id: id,
      is_active: true,
      created_date: now,
      updated_date: now,
    };
    this.scenarios.set(id, record);
    return record;
  }

  getScenario(id: string): ScenarioRecord | null {
    return this.scenarios.get(id) ?? null;
  }

  getAllScenarios(): ScenarioRecord[] {
    return Array.from(this.scenarios.values());
  }

  getActiveScenarios(): ScenarioRecord[] {
    return this.getAllScenarios().filter(s => s.is_active);
  }

  updateScenario(id: string, updates: Partial<ScenarioRecord>): ScenarioRecord | null {
    const record = this.scenarios.get(id);
    if (!record) return null;
    const updated: ScenarioRecord = { ...record, ...updates, scenario_id: id, updated_date: new Date() };
    this.scenarios.set(id, updated);
    return updated;
  }

  deleteScenario(id: string): boolean {
    return this.scenarios.delete(id);
  }

  // ── Validation ────────────────────────────────────────────────────────────

  validateScenario(scenario: ScenarioRecord): ScenarioValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!scenario.name || scenario.name.trim() === '') {
      errors.push('name must not be empty');
    }
    if (scenario.probability < 0 || scenario.probability > 1) {
      errors.push('probability must be between 0 and 1');
    }
    if (scenario.duration_months < 1) {
      errors.push('duration_months must be >= 1');
    }
    if (!scenario.affected_countries || scenario.affected_countries.length === 0) {
      errors.push('affected_countries must not be empty');
    }
    if (!scenario.affected_channels || scenario.affected_channels.length === 0) {
      errors.push('affected_channels must not be empty');
    }

    // Warnings
    if (scenario.severity === 'Critical' && scenario.probability > 0.8) {
      warnings.push('Critical severity with high probability – extreme scenario');
    }
    if (scenario.duration_months > 36) {
      warnings.push('Very long duration scenario (> 36 months)');
    }
    if (scenario.affected_countries.length > 5) {
      warnings.push('Large number of affected countries');
    }

    return { is_valid: errors.length === 0, errors, warnings };
  }

  // ── Core impact calculation ───────────────────────────────────────────────

  applyScenario(company: CompanyExposure, scenario: ScenarioRecord): ScenarioApplyResult {
    const multiplier = SEVERITY_MULTIPLIERS[scenario.severity] ?? 1.0;

    // Resolve which ChannelBreakdown keys are affected
    const affectedKeys = new Set<keyof ChannelBreakdown>(
      scenario.affected_channels
        .map(ch => CHANNEL_ALIASES[ch])
        .filter((k): k is keyof ChannelBreakdown => k !== undefined)
    );

    // Per-channel, per-country contribution
    const channelImpacts: ChannelBreakdown = { revenue: 0, supply_chain: 0, physical_assets: 0, financial: 0 };
    const countryImpactMap = new Map<string, number>();

    for (const seg of company.segments) {
      if (!scenario.affected_countries.includes(seg.country)) continue;

      // Base country contribution: exposureWeight × countryRisk × multiplier
      // countryRisk is a 0–100 CO-GRI score — used directly (not divided by 100)
      const baseContrib = seg.exposureWeight * seg.countryRisk * multiplier;

      let countryTotal = 0;
      for (const key of affectedKeys) {
        const channelWeight = company.channel_breakdown[key] ?? 0;
        const contrib = baseContrib * channelWeight;
        channelImpacts[key] += contrib;
        countryTotal += contrib;
      }

      if (countryTotal > 0) {
        countryImpactMap.set(seg.country, (countryImpactMap.get(seg.country) ?? 0) + countryTotal);
      }
    }

    const delta_CO_GRI =
      channelImpacts.revenue +
      channelImpacts.supply_chain +
      channelImpacts.physical_assets +
      channelImpacts.financial;

    const probability_weighted_delta = delta_CO_GRI * scenario.probability;

    // Build country_impacts array (only countries with non-zero contribution)
    const country_impacts: CountryImpact[] = Array.from(countryImpactMap.entries()).map(
      ([country, delta_contribution]) => ({ country, delta_contribution })
    );

    // Timeline: linear ramp from 0 → delta_CO_GRI over duration_months
    const timeline: TimelinePoint[] = [];
    for (let m = 0; m <= scenario.duration_months; m++) {
      timeline.push({
        month: m,
        cumulative_delta: m === 0 ? 0 : (delta_CO_GRI * m) / scenario.duration_months,
      });
    }

    return {
      scenario_id: scenario.scenario_id,
      company_ticker: company.ticker,
      delta_CO_GRI,
      probability_weighted_delta,
      channel_impacts: channelImpacts,
      country_impacts,
      timeline,
    };
  }

  // ── Multi-scenario comparison ─────────────────────────────────────────────

  compareScenarios(company: CompanyExposure, scenarios: ScenarioRecord[]): ScenarioComparison {
    const results = scenarios.map(s => {
      const r = this.applyScenario(company, s);
      return { scenario: s, delta: r.delta_CO_GRI, weighted: r.probability_weighted_delta };
    });

    // Sort descending by probability-weighted delta to assign risk_rank
    const sorted = [...results].sort((a, b) => b.weighted - a.weighted);

    const scenariosWithRank = results.map(r => {
      const rank = sorted.findIndex(s => s.scenario.scenario_id === r.scenario.scenario_id) + 1;
      return { ...r.scenario, risk_rank: rank, delta_CO_GRI: r.delta };
    });

    const deltas = results.map(r => r.delta);
    const bestId = results.reduce((best, r) => r.delta < best.delta ? r : best, results[0]).scenario.scenario_id;
    const worstId = results.reduce((worst, r) => r.delta > worst.delta ? r : worst, results[0]).scenario.scenario_id;
    const average_delta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;

    return {
      scenarios: scenariosWithRank,
      best_case_scenario_id: bestId,
      worst_case_scenario_id: worstId,
      average_delta,
    };
  }
}

/** Singleton service instance exported for use by tests and application code */
export const scenarioEngineService = new ScenarioEngineService();