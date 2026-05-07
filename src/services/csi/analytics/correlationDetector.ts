/**
 * Correlation Detector - Identify relationships between events
 * 
 * Detects temporal, geographic, sector, and causal correlations.
 */

import type { EventRecord } from '@/types/csi.types';
import { getTradeIntensity } from '../propagation/tradeRelationships';

export type CorrelationType = 'TEMPORAL' | 'GEOGRAPHIC' | 'SECTOR' | 'CAUSAL';

export interface EventCorrelation {
  event1_id: string;
  event2_id: string;
  correlation_type: CorrelationType;
  strength: number; // 0-100
  description: string;
  metadata?: Record<string, any>;
}

export type ChainType = 'LINEAR' | 'CASCADING' | 'FEEDBACK';

export interface EventChain {
  chain_type: ChainType;
  events: EventRecord[];
  description: string;
  total_impact: number;
}

/**
 * Detect all correlations between events
 */
export function detectCorrelations(events: EventRecord[]): EventCorrelation[] {
  const correlations: EventCorrelation[] = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const event1 = events[i];
      const event2 = events[j];

      // Temporal correlation
      const temporal = detectTemporalCorrelation(event1, event2);
      if (temporal) correlations.push(temporal);

      // Geographic correlation
      const geographic = detectGeographicCorrelation(event1, event2);
      if (geographic) correlations.push(geographic);

      // Sector correlation
      const sector = detectSectorCorrelation(event1, event2);
      if (sector) correlations.push(sector);

      // Causal correlation
      const causal = detectCausalCorrelation(event1, event2);
      if (causal) correlations.push(causal);
    }
  }

  return correlations;
}

/**
 * Detect temporal correlation (events close in time)
 */
function detectTemporalCorrelation(
  event1: EventRecord,
  event2: EventRecord
): EventCorrelation | null {
  const date1 = new Date(event1.detected_date);
  const date2 = new Date(event2.detected_date);
  const daysDiff = Math.abs((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

  // Consider events within 7 days as temporally correlated
  if (daysDiff <= 7) {
    const strength = Math.max(0, 100 - (daysDiff / 7) * 100);
    return {
      event1_id: event1.event_id,
      event2_id: event2.event_id,
      correlation_type: 'TEMPORAL',
      strength: Math.round(strength),
      description: `Events occurred ${Math.round(daysDiff)} days apart`,
      metadata: { days_apart: daysDiff }
    };
  }

  return null;
}

/**
 * Detect geographic correlation (same country or strong trade partners)
 */
function detectGeographicCorrelation(
  event1: EventRecord,
  event2: EventRecord
): EventCorrelation | null {
  // Same country
  if (event1.country === event2.country) {
    return {
      event1_id: event1.event_id,
      event2_id: event2.event_id,
      correlation_type: 'GEOGRAPHIC',
      strength: 100,
      description: `Both events in ${event1.country}`,
      metadata: { same_country: true }
    };
  }

  // Strong trade partners
  const tradeIntensity1 = getTradeIntensity(event1.country, event2.country);
  const tradeIntensity2 = getTradeIntensity(event2.country, event1.country);
  const avgIntensity = (tradeIntensity1 + tradeIntensity2) / 2;

  if (avgIntensity >= 50) {
    return {
      event1_id: event1.event_id,
      event2_id: event2.event_id,
      correlation_type: 'GEOGRAPHIC',
      strength: Math.round(avgIntensity),
      description: `Strong trade relationship between ${event1.country} and ${event2.country}`,
      metadata: { trade_intensity: avgIntensity }
    };
  }

  return null;
}

/**
 * Detect sector correlation (affecting same sectors)
 */
function detectSectorCorrelation(
  event1: EventRecord,
  event2: EventRecord
): EventCorrelation | null {
  const sectors1 = new Set(event1.affected_sectors || []);
  const sectors2 = new Set(event2.affected_sectors || []);

  if (sectors1.size === 0 || sectors2.size === 0) {
    return null;
  }

  // Find common sectors
  const commonSectors = Array.from(sectors1).filter(s => sectors2.has(s));

  if (commonSectors.length > 0) {
    const strength = (commonSectors.length / Math.max(sectors1.size, sectors2.size)) * 100;
    return {
      event1_id: event1.event_id,
      event2_id: event2.event_id,
      correlation_type: 'SECTOR',
      strength: Math.round(strength),
      description: `Both affect ${commonSectors.join(', ')}`,
      metadata: { common_sectors: commonSectors }
    };
  }

  return null;
}

/**
 * Detect causal correlation (one event likely caused another)
 */
function detectCausalCorrelation(
  event1: EventRecord,
  event2: EventRecord
): EventCorrelation | null {
  // Check if event2 is a propagated event from event1
  if (event2.origin_event_id === event1.event_id) {
    return {
      event1_id: event1.event_id,
      event2_id: event2.event_id,
      correlation_type: 'CAUSAL',
      strength: 100,
      description: `${event2.country} event propagated from ${event1.country}`,
      metadata: { propagation_hop: event2.propagation_hop }
    };
  }

  // Heuristic: If events are temporally close, geographically linked, and in same sector
  const temporal = detectTemporalCorrelation(event1, event2);
  const geographic = detectGeographicCorrelation(event1, event2);
  const sector = detectSectorCorrelation(event1, event2);

  if (temporal && geographic && sector) {
    const date1 = new Date(event1.detected_date);
    const date2 = new Date(event2.detected_date);
    
    // event1 must be earlier than event2 for causality
    if (date1 < date2) {
      const strength = (temporal.strength + geographic.strength + sector.strength) / 3;
      return {
        event1_id: event1.event_id,
        event2_id: event2.event_id,
        correlation_type: 'CAUSAL',
        strength: Math.round(strength * 0.7), // Reduce confidence for heuristic causality
        description: `${event1.country} event likely influenced ${event2.country}`,
        metadata: { heuristic: true }
      };
    }
  }

  return null;
}

/**
 * Detect event chains
 */
export function detectEventChains(events: EventRecord[]): EventChain[] {
  const chains: EventChain[] = [];
  const correlations = detectCorrelations(events);
  const causalCorrelations = correlations.filter(c => c.correlation_type === 'CAUSAL');

  // Build adjacency map
  const adjacencyMap = new Map<string, string[]>();
  for (const corr of causalCorrelations) {
    if (!adjacencyMap.has(corr.event1_id)) {
      adjacencyMap.set(corr.event1_id, []);
    }
    adjacencyMap.get(corr.event1_id)!.push(corr.event2_id);
  }

  // Find chains
  const visited = new Set<string>();

  for (const event of events) {
    if (visited.has(event.event_id)) continue;

    const chain = buildChain(event.event_id, adjacencyMap, events, visited);
    if (chain.length >= 2) {
      const chainType = determineChainType(chain);
      const totalImpact = chain.reduce((sum, e) => sum + Math.abs(e.delta_csi), 0);

      chains.push({
        chain_type: chainType,
        events: chain,
        description: `${chainType} chain: ${chain.map(e => e.country).join(' → ')}`,
        total_impact: Math.round(totalImpact * 100) / 100
      });
    }
  }

  return chains;
}

/**
 * Build event chain from starting event
 */
function buildChain(
  startEventId: string,
  adjacencyMap: Map<string, string[]>,
  allEvents: EventRecord[],
  visited: Set<string>
): EventRecord[] {
  const chain: EventRecord[] = [];
  const queue = [startEventId];
  const inChain = new Set<string>();

  while (queue.length > 0) {
    const eventId = queue.shift()!;
    if (inChain.has(eventId)) continue;

    const event = allEvents.find(e => e.event_id === eventId);
    if (!event) continue;

    chain.push(event);
    inChain.add(eventId);
    visited.add(eventId);

    const nextEvents = adjacencyMap.get(eventId) || [];
    queue.push(...nextEvents);
  }

  return chain;
}

/**
 * Determine chain type
 */
function determineChainType(chain: EventRecord[]): ChainType {
  const countries = chain.map(e => e.country);
  const uniqueCountries = new Set(countries);

  // Feedback: Same country appears multiple times
  if (uniqueCountries.size < countries.length) {
    return 'FEEDBACK';
  }

  // Cascading: Multiple countries
  if (uniqueCountries.size > 2) {
    return 'CASCADING';
  }

  // Linear: A → B
  return 'LINEAR';
}

/**
 * Get correlation matrix for visualization
 */
export function getCorrelationMatrix(
  events: EventRecord[]
): Array<{ event1: string; event2: string; strength: number; type: CorrelationType }> {
  const correlations = detectCorrelations(events);
  
  return correlations.map(corr => ({
    event1: corr.event1_id,
    event2: corr.event2_id,
    strength: corr.strength,
    type: corr.correlation_type
  }));
}