/**
 * Forecast Event Adapter
 * 
 * Converts GeopoliticalEvent from forecast data into the format expected by event filter.
 * Adds missing fields (affectedSectors, affectedChannels) by deriving them from available data.
 */

import type { GeopoliticalEvent } from '@/types/forecast';
import { Channel } from '@/types/v4Types';

/**
 * Extended event format for filtering
 */
export interface FilterableEvent extends GeopoliticalEvent {
  affectedSectors: string[];
  affectedChannels: Channel[];
  relevanceScore?: number;
  relevanceReasons?: string[];
}

/**
 * Map sector impacts to affected sectors list
 * Sectors with impact >= 1.0 are considered "affected"
 */
function extractAffectedSectors(sectorImpacts: Record<string, number>): string[] {
  return Object.entries(sectorImpacts)
    .filter(([_, impact]) => impact >= 1.0)
    .map(([sector, _]) => sector);
}

/**
 * Infer affected channels from event characteristics
 * 
 * Logic:
 * - High baseImpact (>15) or CRITICAL risk → affects SUPPLY
 * - Sector impacts include "Financial Services" → affects FINANCIAL
 * - Multiple countries affected → affects REVENUE
 * - Any geopolitical event → affects ASSETS (country risk)
 */
function inferAffectedChannels(event: GeopoliticalEvent): Channel[] {
  const channels: Channel[] = [];
  
  // Supply chain disruption for high-impact events
  if (event.baseImpact > 15 || event.riskLevel === 'CRITICAL') {
    channels.push(Channel.SUPPLY);
  }
  
  // Financial channel for financial sector impacts
  if (event.sectorImpacts['Financial Services'] && event.sectorImpacts['Financial Services'] >= 1.0) {
    channels.push(Channel.FINANCIAL);
  }
  
  // Revenue channel for multi-country events
  if (event.affectedCountries.length >= 3) {
    channels.push(Channel.REVENUE);
  }
  
  // Assets channel for all geopolitical events (country risk)
  channels.push(Channel.ASSETS);
  
  // Remove duplicates
  return Array.from(new Set(channels));
}

/**
 * Convert GeopoliticalEvent to FilterableEvent
 * 
 * @param event - Original forecast event
 * @returns Event with added affectedSectors and affectedChannels fields
 */
export function adaptForecastEvent(event: GeopoliticalEvent): FilterableEvent {
  return {
    ...event,
    affectedSectors: extractAffectedSectors(event.sectorImpacts),
    affectedChannels: inferAffectedChannels(event)
  };
}

/**
 * Convert array of GeopoliticalEvents to FilterableEvents
 * 
 * @param events - Array of forecast events
 * @returns Array of filterable events
 */
export function adaptForecastEvents(events: GeopoliticalEvent[]): FilterableEvent[] {
  return events.map(adaptForecastEvent);
}
