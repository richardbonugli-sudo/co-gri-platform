/**
 * Timeline Event Utilities
 * Supporting functions for Timeline Event Feed (C8)
 * Part of CO-GRI Platform Phase 2 - Week 4
 * 
 * UPDATED: Removed generateMockTimelineEvents() mock data generator
 * - Now uses Unified Event Service for real geopolitical events
 * - Kept utility functions for sorting, filtering, and formatting
 * - Kept TimelineEvent type for backward compatibility
 */

export interface TimelineEvent {
  event_id: string;
  date: Date;
  title: string;
  description: string;
  event_type: 'Historical' | 'Forecast' | 'Scenario';
  impact_level: 'High' | 'Medium' | 'Low';
  affected_countries: string[];
  affected_channels: string[];
  delta_CO_GRI?: number;
  probability?: number;
}

/**
 * Sort events by date (most recent first)
 */
export function sortEventsByDate(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Filter events by type
 */
export function filterEventsByType(
  events: TimelineEvent[],
  types: string[]
): TimelineEvent[] {
  if (types.length === 0 || types.includes('all')) {
    return events;
  }
  return events.filter(event => types.includes(event.event_type));
}

/**
 * Filter events by impact level
 */
export function filterEventsByImpact(
  events: TimelineEvent[],
  minImpact: 'High' | 'Medium' | 'Low'
): TimelineEvent[] {
  const impactOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
  const threshold = impactOrder[minImpact];
  
  return events.filter(event => impactOrder[event.impact_level] >= threshold);
}

/**
 * Get impact level color
 */
export function getImpactColor(impact: string): string {
  switch (impact) {
    case 'High': return 'bg-red-100 text-red-700 border-red-300';
    case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'Low': return 'bg-green-100 text-green-700 border-green-300';
    default: return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

/**
 * Get event type color
 */
export function getEventTypeColor(type: string): string {
  switch (type) {
    case 'Historical': return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'Forecast': return 'bg-purple-100 text-purple-700 border-purple-300';
    case 'Scenario': return 'bg-orange-100 text-orange-700 border-orange-300';
    default: return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

/**
 * Format date for display
 */
export function formatEventDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}