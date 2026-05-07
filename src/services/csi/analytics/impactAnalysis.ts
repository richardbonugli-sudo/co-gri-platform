/**
 * Impact Analysis - Calculate and rank event impact scores
 * 
 * Analyzes events based on geographic reach, sector breadth, duration, and severity.
 */

import type { EventRecord } from '@/types/csi.types';
import { eventStore } from '../eventStore';
import { getPropagatedEvents } from '../eventStore';

export interface ImpactScore {
  event_id: string;
  composite_impact: number; // 0-100
  geographic_reach: number; // 0-100
  sector_breadth: number; // 0-100
  duration_score: number; // 0-100
  severity_score: number; // 0-100
  affected_countries: string[];
  affected_sectors: string[];
  days_active: number;
}

export interface CountryImpact {
  country: string;
  total_impact: number;
  event_count: number;
  avg_impact: number;
  top_events: Array<{ event_id: string; impact: number }>;
}

export interface SectorImpact {
  sector: string;
  total_impact: number;
  event_count: number;
  avg_impact: number;
  top_events: Array<{ event_id: string; impact: number }>;
}

/**
 * Calculate impact score for a single event
 */
export function calculateImpactScore(event: EventRecord): ImpactScore {
  // Geographic Reach: Based on propagation
  const propagatedEventIds = getPropagatedEvents(event.event_id);
  const propagatedEvents = propagatedEventIds
    .map(id => eventStore.getEvent(id))
    .filter((e): e is EventRecord => e !== undefined);
  
  const affectedCountries = new Set([event.country, ...propagatedEvents.map(e => e.country)]);
  const geographic_reach = Math.min(100, (affectedCountries.size / 50) * 100); // Normalize to 50 countries max

  // Sector Breadth: Based on affected sectors
  const allSectors = new Set([
    ...(event.affected_sectors || []),
    ...propagatedEvents.flatMap(e => e.affected_sectors || [])
  ]);
  const sector_breadth = Math.min(100, (allSectors.size / 10) * 100); // Normalize to 10 sectors max

  // Duration Score: Based on event lifecycle
  const days_active = calculateDaysActive(event);
  const duration_score = Math.min(100, (days_active / 365) * 100); // Normalize to 1 year max

  // Severity Score: Normalized severity
  const severity_score = (event.severity / 10) * 100;

  // Composite Impact: Weighted average
  const composite_impact = 
    geographic_reach * 0.30 +
    sector_breadth * 0.20 +
    duration_score * 0.20 +
    severity_score * 0.30;

  return {
    event_id: event.event_id,
    composite_impact: Math.round(composite_impact * 100) / 100,
    geographic_reach: Math.round(geographic_reach * 100) / 100,
    sector_breadth: Math.round(sector_breadth * 100) / 100,
    duration_score: Math.round(duration_score * 100) / 100,
    severity_score: Math.round(severity_score * 100) / 100,
    affected_countries: Array.from(affectedCountries),
    affected_sectors: Array.from(allSectors),
    days_active
  };
}

/**
 * Calculate days active for an event
 */
function calculateDaysActive(event: EventRecord): number {
  const startDate = new Date(event.effective_date || event.detected_date);
  const endDate = event.resolved_date ? new Date(event.resolved_date) : new Date();
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get top impactful events
 */
export function getTopImpactfulEvents(events: EventRecord[], limit: number = 10): ImpactScore[] {
  const scores = events.map(event => calculateImpactScore(event));
  return scores
    .sort((a, b) => b.composite_impact - a.composite_impact)
    .slice(0, limit);
}

/**
 * Get impact by country
 */
export function getImpactByCountry(events: EventRecord[]): CountryImpact[] {
  const countryMap = new Map<string, { events: EventRecord[]; impacts: number[] }>();

  for (const event of events) {
    const impact = calculateImpactScore(event);
    
    for (const country of impact.affected_countries) {
      if (!countryMap.has(country)) {
        countryMap.set(country, { events: [], impacts: [] });
      }
      const data = countryMap.get(country)!;
      data.events.push(event);
      data.impacts.push(impact.composite_impact);
    }
  }

  const result: CountryImpact[] = [];
  
  for (const [country, data] of countryMap.entries()) {
    const total_impact = data.impacts.reduce((sum, val) => sum + val, 0);
    const avg_impact = total_impact / data.impacts.length;
    
    const topEvents = data.events
      .map((event, i) => ({ event_id: event.event_id, impact: data.impacts[i] }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5);

    result.push({
      country,
      total_impact: Math.round(total_impact * 100) / 100,
      event_count: data.events.length,
      avg_impact: Math.round(avg_impact * 100) / 100,
      top_events: topEvents
    });
  }

  return result.sort((a, b) => b.total_impact - a.total_impact);
}

/**
 * Get impact by sector
 */
export function getImpactBySector(events: EventRecord[]): SectorImpact[] {
  const sectorMap = new Map<string, { events: EventRecord[]; impacts: number[] }>();

  for (const event of events) {
    const impact = calculateImpactScore(event);
    
    for (const sector of impact.affected_sectors) {
      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, { events: [], impacts: [] });
      }
      const data = sectorMap.get(sector)!;
      data.events.push(event);
      data.impacts.push(impact.composite_impact);
    }
  }

  const result: SectorImpact[] = [];
  
  for (const [sector, data] of sectorMap.entries()) {
    const total_impact = data.impacts.reduce((sum, val) => sum + val, 0);
    const avg_impact = total_impact / data.impacts.length;
    
    const topEvents = data.events
      .map((event, i) => ({ event_id: event.event_id, impact: data.impacts[i] }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5);

    result.push({
      sector,
      total_impact: Math.round(total_impact * 100) / 100,
      event_count: data.events.length,
      avg_impact: Math.round(avg_impact * 100) / 100,
      top_events: topEvents
    });
  }

  return result.sort((a, b) => b.total_impact - a.total_impact);
}

/**
 * Get impact trend over time
 */
export function getImpactTrend(
  events: EventRecord[],
  startDate: string,
  endDate: string,
  intervalDays: number = 7
): Array<{ date: string; total_impact: number; event_count: number }> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const trend: Array<{ date: string; total_impact: number; event_count: number }> = [];

  let currentDate = new Date(start);
  
  while (currentDate <= end) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + intervalDays);

    const periodEvents = events.filter(event => {
      const eventDate = new Date(event.detected_date);
      return eventDate >= currentDate && eventDate < nextDate;
    });

    const total_impact = periodEvents.reduce((sum, event) => {
      return sum + calculateImpactScore(event).composite_impact;
    }, 0);

    trend.push({
      date: currentDate.toISOString().split('T')[0],
      total_impact: Math.round(total_impact * 100) / 100,
      event_count: periodEvents.length
    });

    currentDate = nextDate;
  }

  return trend;
}