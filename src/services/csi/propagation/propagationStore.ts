/**
 * Propagation Store - Manages propagated event data and statistics
 * 
 * Provides indexing and query functions for propagation analysis.
 */

import type { EventRecord } from '@/types/csi.types';
import { eventStore } from '../eventStore';

export interface PropagationStatistics {
  total_propagated_events: number;
  unique_origin_events: number;
  countries_affected: string[];
  average_hops: number;
  total_intensity: number;
  by_hop: Record<number, number>;
  by_country: Record<string, number>;
}

/**
 * Get all propagated events
 */
export function getAllPropagatedEvents(): EventRecord[] {
  return eventStore.getAllEvents().filter(event => event.origin_event_id !== undefined);
}

/**
 * Get propagated events by origin
 */
export function getPropagatedEventsByOrigin(originEventId: string): EventRecord[] {
  const propagatedIds = eventStore.getPropagatedEvents(originEventId);
  return propagatedIds
    .map(id => eventStore.getEvent(id))
    .filter((e): e is EventRecord => e !== undefined);
}

/**
 * Get propagated events for a target country
 */
export function getPropagatedEventsByCountry(country: string): EventRecord[] {
  return getAllPropagatedEvents().filter(event => event.country === country);
}

/**
 * Get propagated events by hop count
 */
export function getPropagatedEventsByHop(hop: number): EventRecord[] {
  return getAllPropagatedEvents().filter(event => event.propagation_hop === hop);
}

/**
 * Calculate propagation statistics
 */
export function calculatePropagationStatistics(): PropagationStatistics {
  const propagatedEvents = getAllPropagatedEvents();
  
  const uniqueOrigins = new Set(
    propagatedEvents.map(e => e.origin_event_id).filter((id): id is string => id !== undefined)
  );
  
  const countriesAffected = new Set(propagatedEvents.map(e => e.country));
  
  const byHop: Record<number, number> = {};
  const byCountry: Record<string, number> = {};
  let totalHops = 0;
  let totalIntensity = 0;

  for (const event of propagatedEvents) {
    // By hop
    const hop = event.propagation_hop || 0;
    byHop[hop] = (byHop[hop] || 0) + 1;
    totalHops += hop;

    // By country
    byCountry[event.country] = (byCountry[event.country] || 0) + 1;

    // Total intensity
    totalIntensity += Math.abs(event.delta_csi);
  }

  return {
    total_propagated_events: propagatedEvents.length,
    unique_origin_events: uniqueOrigins.size,
    countries_affected: Array.from(countriesAffected),
    average_hops: propagatedEvents.length > 0 ? totalHops / propagatedEvents.length : 0,
    total_intensity: totalIntensity,
    by_hop: byHop,
    by_country: byCountry
  };
}

/**
 * Get propagation chain for an event
 */
export function getPropagationChain(eventId: string): EventRecord[] {
  const event = eventStore.getEvent(eventId);
  if (!event) {
    return [];
  }

  const chain: EventRecord[] = [event];

  // If this is a propagated event, trace back to origin
  if (event.origin_event_id) {
    const originEvent = eventStore.getEvent(event.origin_event_id);
    if (originEvent) {
      chain.unshift(...getPropagationChain(originEvent.event_id));
    }
  }

  // If this is an origin event, get all propagated events
  if (eventStore.hasBeenPropagated(eventId)) {
    const propagated = getPropagatedEventsByOrigin(eventId);
    chain.push(...propagated);
  }

  return chain;
}

/**
 * Get countries affected by propagation from an origin event
 */
export function getAffectedCountries(originEventId: string): string[] {
  const propagatedEvents = getPropagatedEventsByOrigin(originEventId);
  return Array.from(new Set(propagatedEvents.map(e => e.country)));
}

/**
 * Check if a country is affected by propagation
 */
export function isCountryAffected(country: string, originEventId: string): boolean {
  const affectedCountries = getAffectedCountries(originEventId);
  return affectedCountries.includes(country);
}

/**
 * Get propagation intensity for a country
 */
export function getPropagationIntensity(country: string, originEventId: string): number {
  const events = getPropagatedEventsByOrigin(originEventId).filter(e => e.country === country);
  return events.reduce((sum, e) => sum + Math.abs(e.delta_csi), 0);
}