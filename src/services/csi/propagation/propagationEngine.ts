/**
 * Propagation Engine - Multi-hop event propagation through trade networks
 * 
 * Automatically propagates geopolitical events through trade relationships
 * with decay factors and deduplication.
 */

import type { EventRecord, CreateEventInput } from '@/types/csi.types';
import { eventStore } from '../eventStore';
import { getTradePartners, type TradeRelationship } from './tradeRelationships';
import { getPropagationRule, getSectorMultiplier } from './propagationRules';

export interface PropagationResult {
  origin_event_id: string;
  propagated_events: EventRecord[];
  total_countries_affected: number;
  propagation_summary: {
    hop: number;
    countries: string[];
    avg_intensity: number;
  }[];
}

interface PropagationNode {
  country: string;
  hop: number;
  intensity: number;
  path: string[];
}

/**
 * Propagate an event through trade networks
 */
export async function propagateEvent(originEvent: EventRecord): Promise<PropagationResult> {
  console.log(`[Propagation Engine] 🌐 Starting propagation for event ${originEvent.event_id}`);

  // Check if event is eligible for propagation
  if (!originEvent.propagation_eligible) {
    console.log(`[Propagation Engine] ⚠️ Event ${originEvent.event_id} not eligible for propagation`);
    return {
      origin_event_id: originEvent.event_id,
      propagated_events: [],
      total_countries_affected: 0,
      propagation_summary: []
    };
  }

  // Get propagation rule
  const rule = getPropagationRule(originEvent.event_type);
  if (!rule) {
    console.log(`[Propagation Engine] ⚠️ No propagation rule for event type ${originEvent.event_type}`);
    return {
      origin_event_id: originEvent.event_id,
      propagated_events: [],
      total_countries_affected: 0,
      propagation_summary: []
    };
  }

  // Initialize propagation
  const visited = new Set<string>([originEvent.country]);
  const propagatedEvents: EventRecord[] = [];
  const summaryByHop: Map<number, { countries: string[]; intensities: number[] }> = new Map();
  
  let queue: PropagationNode[] = [{
    country: originEvent.country,
    hop: 0,
    intensity: originEvent.delta_csi,
    path: [originEvent.country]
  }];

  // Multi-hop propagation
  for (let currentHop = 1; currentHop <= rule.max_hops; currentHop++) {
    const nextQueue: PropagationNode[] = [];
    const hopCountries: string[] = [];
    const hopIntensities: number[] = [];

    for (const node of queue) {
      // Get trade partners
      const partners = getTradePartners(node.country, rule.min_intensity_threshold);

      for (const partner of partners) {
        // Skip if already visited (deduplication)
        if (visited.has(partner.to)) {
          continue;
        }

        // Calculate propagation intensity
        const sectorMultiplier = getSectorMultiplier(rule, originEvent.affected_sectors);
        const tradeMultiplier = partner.intensity / 100;
        const decayFactor = Math.pow(rule.decay_per_hop, currentHop);
        
        const propagatedIntensity = 
          node.intensity * 
          tradeMultiplier * 
          sectorMultiplier * 
          decayFactor;

        // Check if intensity is above minimum threshold
        if (propagatedIntensity < 0.5) {
          continue;
        }

        // Create propagated event
        const propagatedEvent = createPropagatedEvent(
          originEvent,
          partner.to,
          currentHop,
          propagatedIntensity,
          [...node.path, partner.to],
          partner
        );

        propagatedEvents.push(propagatedEvent);
        visited.add(partner.to);
        hopCountries.push(partner.to);
        hopIntensities.push(propagatedIntensity);

        // Add to next queue for further propagation
        nextQueue.push({
          country: partner.to,
          hop: currentHop,
          intensity: propagatedIntensity,
          path: [...node.path, partner.to]
        });

        // Track in event store
        eventStore.addPropagatedEvent(originEvent.event_id, propagatedEvent.event_id);
      }
    }

    // Record hop summary
    if (hopCountries.length > 0) {
      summaryByHop.set(currentHop, {
        countries: hopCountries,
        intensities: hopIntensities
      });
    }

    // Update queue for next hop
    queue = nextQueue;

    // Stop if no more propagation
    if (queue.length === 0) {
      break;
    }
  }

  // Build summary
  const propagation_summary = Array.from(summaryByHop.entries()).map(([hop, data]) => ({
    hop,
    countries: data.countries,
    avg_intensity: data.intensities.reduce((a, b) => a + b, 0) / data.intensities.length
  }));

  console.log(`[Propagation Engine] ✅ Propagated to ${propagatedEvents.length} countries across ${propagation_summary.length} hops`);

  return {
    origin_event_id: originEvent.event_id,
    propagated_events: propagatedEvents,
    total_countries_affected: propagatedEvents.length,
    propagation_summary
  };
}

/**
 * Create a propagated event record
 */
function createPropagatedEvent(
  originEvent: EventRecord,
  targetCountry: string,
  hop: number,
  intensity: number,
  path: string[],
  tradeRelationship: TradeRelationship
): EventRecord {
  const now = new Date().toISOString();
  
  const input: CreateEventInput = {
    country: targetCountry,
    event_type: originEvent.event_type,
    primary_vector: originEvent.primary_vector,
    secondary_vectors: originEvent.secondary_vectors,
    severity: Math.max(1, Math.round(originEvent.severity * Math.pow(0.7, hop))),
    delta_csi: Math.round(intensity * 100) / 100,
    detected_date: now,
    effective_date: originEvent.effective_date,
    description: `Propagated from ${originEvent.country}: ${originEvent.description}`,
    sources: [`PROPAGATED:${originEvent.event_id}`],
    rationale: `Trade network propagation (hop ${hop}) via ${path.join(' → ')}. Trade intensity: ${tradeRelationship.intensity}`,
    affected_sectors: tradeRelationship.sectors || originEvent.affected_sectors,
    decay_schedule: originEvent.decay_schedule,
    propagation_eligible: false, // Propagated events don't propagate further
    created_by: 'PROPAGATION_ENGINE'
  };

  const event = eventStore.createEvent(input);
  
  // Add propagation metadata
  event.origin_event_id = originEvent.event_id;
  event.propagation_hop = hop;
  
  // Auto-confirm propagated events (no manual review needed)
  // Must follow state machine: DETECTED → PROVISIONAL → CONFIRMED
  eventStore.transitionEventState({
    event_id: event.event_id,
    new_state: 'PROVISIONAL',
    user: 'PROPAGATION_ENGINE',
    reason: `Propagated event from ${originEvent.event_id} - transitioning to provisional`
  });
  
  eventStore.transitionEventState({
    event_id: event.event_id,
    new_state: 'CONFIRMED',
    user: 'PROPAGATION_ENGINE',
    reason: `Auto-confirmed propagated event from ${originEvent.event_id}`
  });

  return event;
}

/**
 * Get propagation network data for visualization
 */
export function getPropagationNetworkData(originEventId: string): {
  nodes: Array<{ id: string; country: string; hop: number; intensity: number }>;
  links: Array<{ source: string; target: string; intensity: number }>;
} {
  const originEvent = eventStore.getEvent(originEventId);
  if (!originEvent) {
    return { nodes: [], links: [] };
  }

  const nodes: Array<{ id: string; country: string; hop: number; intensity: number }> = [
    { id: originEvent.event_id, country: originEvent.country, hop: 0, intensity: originEvent.delta_csi }
  ];

  const links: Array<{ source: string; target: string; intensity: number }> = [];

  const propagatedEventIds = eventStore.getPropagatedEvents(originEventId);
  
  for (const eventId of propagatedEventIds) {
    const event = eventStore.getEvent(eventId);
    if (event && event.origin_event_id) {
      nodes.push({
        id: event.event_id,
        country: event.country,
        hop: event.propagation_hop || 0,
        intensity: event.delta_csi
      });

      links.push({
        source: event.origin_event_id,
        target: event.event_id,
        intensity: event.delta_csi
      });
    }
  }

  return { nodes, links };
}

/**
 * Trigger propagation when event is confirmed
 */
export async function onEventConfirmed(event: EventRecord): Promise<void> {
  if (event.state === 'CONFIRMED' && event.propagation_eligible) {
    console.log(`[Propagation Engine] 🔔 Event confirmed, triggering propagation: ${event.event_id}`);
    await propagateEvent(event);
  }
}