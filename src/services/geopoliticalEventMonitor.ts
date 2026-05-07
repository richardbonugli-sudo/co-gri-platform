/**
 * Geopolitical Event Monitor - Phase 2 Task 2
 * 
 * Monitors and scores geopolitical events that impact COGRI multipliers.
 * Events are categorized by type, severity, and affected regions/sectors.
 */

export type GeopoliticalEventType = 
  | 'sanctions'
  | 'trade_war'
  | 'military_conflict'
  | 'policy_change'
  | 'diplomatic_crisis'
  | 'regime_change'
  | 'economic_crisis'
  | 'natural_disaster'
  | 'cyber_attack'
  | 'terrorism';

export type EventSeverity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface GeopoliticalEvent {
  id: string;
  type: GeopoliticalEventType;
  name: string;
  description: string;
  severity: EventSeverity; // 1 (minor) to 10 (critical)
  startDate: string; // ISO date
  endDate?: string; // ISO date, undefined if ongoing
  affectedCountries: string[];
  affectedSectors: string[];
  affectedChannels: Array<'Revenue' | 'Supply' | 'Assets' | 'Financial'>;
  multiplierImpact: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
  };
  decayRate: number; // 0-1, how quickly impact diminishes (0.1 = slow, 0.5 = fast)
  confidence: number; // 0-1
  sources: string[];
  tags: string[];
}

/**
 * Active geopolitical events database
 */
export const ACTIVE_GEOPOLITICAL_EVENTS: GeopoliticalEvent[] = [
  {
    id: 'RUS-UKR-2022',
    type: 'military_conflict',
    name: 'Russia-Ukraine Conflict',
    description: 'Ongoing military conflict between Russia and Ukraine, resulting in comprehensive Western sanctions on Russia and supply chain disruptions.',
    severity: 9,
    startDate: '2022-02-24',
    affectedCountries: ['Russia', 'Ukraine', 'Belarus'],
    affectedSectors: ['Energy', 'Materials', 'Industrials', 'Consumer Discretionary', 'Technology'],
    affectedChannels: ['Revenue', 'Supply', 'Assets', 'Financial'],
    multiplierImpact: {
      revenue: 0.15,
      supply: 0.20,
      assets: 0.25,
      financial: 0.30
    },
    decayRate: 0.05, // Very slow decay, ongoing conflict
    confidence: 0.95,
    sources: ['UN Reports', 'OFAC Sanctions List', 'EU Sanctions Database'],
    tags: ['sanctions', 'energy_crisis', 'supply_chain', 'banking_restrictions']
  },
  {
    id: 'US-CN-TECH-2018',
    type: 'trade_war',
    name: 'US-China Tech Trade Restrictions',
    description: 'US export controls on advanced semiconductors and technology to China, including entity list additions and CHIPS Act restrictions.',
    severity: 8,
    startDate: '2018-03-22',
    affectedCountries: ['China', 'United States'],
    affectedSectors: ['Technology', 'Communication Services', 'Industrials'],
    affectedChannels: ['Revenue', 'Supply'],
    multiplierImpact: {
      revenue: 0.12,
      supply: 0.18,
      assets: 0.05,
      financial: 0.08
    },
    decayRate: 0.03, // Very slow decay, structural issue
    confidence: 0.92,
    sources: ['BIS Entity List', 'CHIPS Act', 'Commerce Department'],
    tags: ['semiconductors', 'export_controls', 'entity_list', 'technology_transfer']
  },
  {
    id: 'RED-SEA-2023',
    type: 'military_conflict',
    name: 'Red Sea Shipping Crisis',
    description: 'Houthi attacks on commercial shipping in Red Sea forcing vessels to reroute around Africa, increasing transit times and costs.',
    severity: 6,
    startDate: '2023-10-19',
    affectedCountries: ['Yemen', 'Saudi Arabia', 'Egypt'],
    affectedSectors: ['Industrials', 'Consumer Discretionary', 'Materials', 'Energy'],
    affectedChannels: ['Supply'],
    multiplierImpact: {
      revenue: 0.03,
      supply: 0.15,
      assets: 0.02,
      financial: 0.05
    },
    decayRate: 0.10, // Moderate decay, could resolve
    confidence: 0.88,
    sources: ['IMO Reports', 'Shipping Industry News', 'US Navy Statements'],
    tags: ['shipping', 'logistics', 'supply_chain', 'transportation']
  },
  {
    id: 'IRAN-SANCTIONS-2018',
    type: 'sanctions',
    name: 'Iran Comprehensive Sanctions',
    description: 'US reimposition of comprehensive sanctions on Iran following withdrawal from JCPOA, targeting oil exports, banking, and shipping.',
    severity: 7,
    startDate: '2018-05-08',
    affectedCountries: ['Iran'],
    affectedSectors: ['Energy', 'Financials', 'Materials'],
    affectedChannels: ['Revenue', 'Financial'],
    multiplierImpact: {
      revenue: 0.10,
      supply: 0.08,
      assets: 0.12,
      financial: 0.25
    },
    decayRate: 0.02, // Very slow decay, structural sanctions
    confidence: 0.90,
    sources: ['OFAC', 'State Department', 'Treasury Department'],
    tags: ['oil_sanctions', 'banking_sanctions', 'swift_restrictions']
  },
  {
    id: 'VENEZUELA-CRISIS-2019',
    type: 'economic_crisis',
    name: 'Venezuela Economic and Political Crisis',
    description: 'Ongoing economic collapse and political instability in Venezuela with US sanctions on oil sector and government officials.',
    severity: 8,
    startDate: '2019-01-28',
    affectedCountries: ['Venezuela'],
    affectedSectors: ['Energy', 'Materials', 'Financials'],
    affectedChannels: ['Revenue', 'Assets', 'Financial'],
    multiplierImpact: {
      revenue: 0.15,
      supply: 0.10,
      assets: 0.30,
      financial: 0.20
    },
    decayRate: 0.04, // Slow decay, structural crisis
    confidence: 0.87,
    sources: ['OFAC', 'World Bank', 'IMF'],
    tags: ['hyperinflation', 'asset_seizures', 'oil_industry', 'political_instability']
  },
  {
    id: 'MYANMAR-COUP-2021',
    type: 'regime_change',
    name: 'Myanmar Military Coup',
    description: 'Military coup in Myanmar leading to civil unrest, international sanctions, and business disruptions.',
    severity: 7,
    startDate: '2021-02-01',
    affectedCountries: ['Myanmar'],
    affectedSectors: ['Consumer Discretionary', 'Industrials', 'Materials'],
    affectedChannels: ['Revenue', 'Supply', 'Assets'],
    multiplierImpact: {
      revenue: 0.12,
      supply: 0.15,
      assets: 0.20,
      financial: 0.10
    },
    decayRate: 0.08, // Moderate decay
    confidence: 0.85,
    sources: ['UN Reports', 'ASEAN', 'US State Department'],
    tags: ['political_instability', 'sanctions', 'civil_unrest']
  },
  {
    id: 'TURKEY-CURRENCY-2021',
    type: 'economic_crisis',
    name: 'Turkish Lira Currency Crisis',
    description: 'Sharp depreciation of Turkish Lira due to monetary policy decisions and inflation concerns.',
    severity: 5,
    startDate: '2021-09-01',
    affectedCountries: ['Turkey'],
    affectedSectors: ['Financials', 'Consumer Discretionary', 'Industrials'],
    affectedChannels: ['Revenue', 'Financial'],
    multiplierImpact: {
      revenue: 0.10,
      supply: 0.05,
      assets: 0.08,
      financial: 0.15
    },
    decayRate: 0.12, // Moderate-fast decay, could stabilize
    confidence: 0.82,
    sources: ['Central Bank of Turkey', 'IMF', 'Bloomberg'],
    tags: ['currency_crisis', 'inflation', 'monetary_policy']
  },
  {
    id: 'ISRAEL-HAMAS-2023',
    type: 'military_conflict',
    name: 'Israel-Hamas Conflict',
    description: 'Military conflict between Israel and Hamas following October 7 attacks, affecting regional stability.',
    severity: 7,
    startDate: '2023-10-07',
    affectedCountries: ['Israel', 'Palestine', 'Lebanon'],
    affectedSectors: ['Technology', 'Industrials', 'Financials'],
    affectedChannels: ['Revenue', 'Supply', 'Assets'],
    multiplierImpact: {
      revenue: 0.08,
      supply: 0.10,
      assets: 0.15,
      financial: 0.08
    },
    decayRate: 0.10, // Moderate decay
    confidence: 0.88,
    sources: ['UN Reports', 'IDF', 'US State Department'],
    tags: ['regional_conflict', 'security_risk', 'infrastructure']
  }
];

/**
 * Calculate event impact with temporal decay
 * 
 * Impact diminishes over time based on decay rate:
 * Impact = BaseImpact × e^(-decayRate × daysSinceStart)
 */
export function calculateEventImpact(
  event: GeopoliticalEvent,
  currentDate: Date = new Date()
): {
  currentImpact: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
  };
  decayFactor: number;
  daysSinceStart: number;
  isActive: boolean;
} {
  const startDate = new Date(event.startDate);
  const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Check if event has ended
  const isActive = !event.endDate || new Date(event.endDate) > currentDate;
  
  // Calculate decay factor: e^(-decayRate × days)
  const decayFactor = Math.exp(-event.decayRate * (daysSinceStart / 365)); // Normalize to years
  
  // Apply decay to base impact (only if event is still active)
  const currentImpact = isActive ? {
    revenue: event.multiplierImpact.revenue * decayFactor,
    supply: event.multiplierImpact.supply * decayFactor,
    assets: event.multiplierImpact.assets * decayFactor,
    financial: event.multiplierImpact.financial * decayFactor
  } : {
    revenue: 0,
    supply: 0,
    assets: 0,
    financial: 0
  };
  
  return {
    currentImpact,
    decayFactor,
    daysSinceStart,
    isActive
  };
}

/**
 * Get events affecting a specific country
 */
export function getEventsForCountry(
  country: string,
  currentDate: Date = new Date()
): Array<GeopoliticalEvent & { currentImpact: ReturnType<typeof calculateEventImpact> }> {
  return ACTIVE_GEOPOLITICAL_EVENTS
    .filter(event => event.affectedCountries.includes(country))
    .map(event => ({
      ...event,
      currentImpact: calculateEventImpact(event, currentDate)
    }))
    .filter(event => event.currentImpact.isActive);
}

/**
 * Get events affecting a specific sector
 */
export function getEventsForSector(
  sector: string,
  currentDate: Date = new Date()
): Array<GeopoliticalEvent & { currentImpact: ReturnType<typeof calculateEventImpact> }> {
  return ACTIVE_GEOPOLITICAL_EVENTS
    .filter(event => event.affectedSectors.includes(sector))
    .map(event => ({
      ...event,
      currentImpact: calculateEventImpact(event, currentDate)
    }))
    .filter(event => event.currentImpact.isActive);
}

/**
 * Get events affecting a specific channel
 */
export function getEventsForChannel(
  channel: 'Revenue' | 'Supply' | 'Assets' | 'Financial',
  currentDate: Date = new Date()
): Array<GeopoliticalEvent & { currentImpact: ReturnType<typeof calculateEventImpact> }> {
  return ACTIVE_GEOPOLITICAL_EVENTS
    .filter(event => event.affectedChannels.includes(channel))
    .map(event => ({
      ...event,
      currentImpact: calculateEventImpact(event, currentDate)
    }))
    .filter(event => event.currentImpact.isActive);
}

/**
 * Calculate aggregate event impact for country-channel combination
 */
export function calculateAggregateEventImpact(
  country: string,
  channel: 'Revenue' | 'Supply' | 'Assets' | 'Financial',
  currentDate: Date = new Date()
): {
  totalImpact: number;
  eventCount: number;
  events: Array<{
    id: string;
    name: string;
    type: GeopoliticalEventType;
    severity: EventSeverity;
    impact: number;
    decayFactor: number;
  }>;
} {
  const countryEvents = getEventsForCountry(country, currentDate);
  const relevantEvents = countryEvents.filter(event => event.affectedChannels.includes(channel));
  
  const channelKey = channel.toLowerCase() as 'revenue' | 'supply' | 'assets' | 'financial';
  
  const events = relevantEvents.map(event => ({
    id: event.id,
    name: event.name,
    type: event.type,
    severity: event.severity,
    impact: event.currentImpact.currentImpact[channelKey],
    decayFactor: event.currentImpact.decayFactor
  }));
  
  // Sum impacts (capped at 0.50 to prevent extreme multipliers)
  const totalImpact = Math.min(
    events.reduce((sum, e) => sum + e.impact, 0),
    0.50
  );
  
  return {
    totalImpact,
    eventCount: events.length,
    events
  };
}

/**
 * Get all active events
 */
export function getAllActiveEvents(currentDate: Date = new Date()): GeopoliticalEvent[] {
  return ACTIVE_GEOPOLITICAL_EVENTS
    .map(event => ({
      ...event,
      impact: calculateEventImpact(event, currentDate)
    }))
    .filter(event => event.impact.isActive)
    .map(({ impact, ...event }) => event);
}

/**
 * Get event by ID
 */
export function getEventById(eventId: string): GeopoliticalEvent | undefined {
  return ACTIVE_GEOPOLITICAL_EVENTS.find(event => event.id === eventId);
}

/**
 * Get event statistics
 */
export function getEventStatistics(currentDate: Date = new Date()): {
  totalEvents: number;
  activeEvents: number;
  byType: Record<GeopoliticalEventType, number>;
  bySeverity: Record<string, number>;
  averageSeverity: number;
} {
  const activeEvents = getAllActiveEvents(currentDate);
  
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  let totalSeverity = 0;
  
  activeEvents.forEach(event => {
    byType[event.type] = (byType[event.type] || 0) + 1;
    bySeverity[event.severity.toString()] = (bySeverity[event.severity.toString()] || 0) + 1;
    totalSeverity += event.severity;
  });
  
  return {
    totalEvents: ACTIVE_GEOPOLITICAL_EVENTS.length,
    activeEvents: activeEvents.length,
    byType: byType as Record<GeopoliticalEventType, number>,
    bySeverity,
    averageSeverity: activeEvents.length > 0 ? totalSeverity / activeEvents.length : 0
  };
}

/**
 * Add new geopolitical event (for testing or manual entry)
 */
export function addGeopoliticalEvent(event: GeopoliticalEvent): void {
  ACTIVE_GEOPOLITICAL_EVENTS.push(event);
  console.log(`[Geopolitical Event Monitor] Added new event: ${event.name} (${event.id})`);
}

/**
 * Update event end date (mark as resolved)
 */
export function resolveEvent(eventId: string, endDate: string): boolean {
  const event = getEventById(eventId);
  if (event) {
    event.endDate = endDate;
    console.log(`[Geopolitical Event Monitor] Resolved event: ${event.name} (${eventId}) on ${endDate}`);
    return true;
  }
  return false;
}