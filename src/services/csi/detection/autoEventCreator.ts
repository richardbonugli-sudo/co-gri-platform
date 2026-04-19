/**
 * Auto Event Creator
 * 
 * Converts confirmed event candidates into EventRecord objects.
 * Calculates severity and ΔCSI based on event type, country, and scope.
 */

import { eventStore } from '../eventStore';
import type { EventCandidate } from './candidateDetector';
import type { CreateEventInput, EventRecord, EventType } from '@/types/csi.types';
import { getCountryData } from '@/data/globalCountries';

/**
 * Calculate severity (1-10) based on event characteristics
 */
function calculateSeverity(candidate: EventCandidate): number {
  const { event_type, entities, confidence } = candidate;
  
  let severity: number; // Base severity
  
  // Event type impact
  const eventTypeImpact: Record<EventType, number> = {
    'SANCTION': 7,
    'EXPORT_CONTROL': 6,
    'TARIFF': 5,
    'KINETIC': 9,
    'CAPITAL_CONTROL': 6,
    'COUP': 8,
    'CYBER_ATTACK': 6,
    'TRADE_RESTRICTION': 5,
    'OTHER': 4
  };
  
  severity = eventTypeImpact[event_type] || 5;
  
  // Adjust based on sectors affected
  if (entities.sectors.length >= 3) {
    severity += 1; // Multiple sectors affected
  }
  
  // Adjust based on confidence
  if (confidence >= 90) {
    severity += 1; // High confidence in detection
  }
  
  // Cap at 10
  return Math.min(severity, 10);
}

/**
 * Calculate ΔCSI based on severity
 */
function calculateDeltaCSI(severity: number, eventType: EventType): number {
  // Base ΔCSI by severity range
  let deltaCSI: number;
  
  if (severity >= 1 && severity <= 3) {
    deltaCSI = 0.5 + (severity - 1) * 0.25; // 0.5 to 1.0
  } else if (severity >= 4 && severity <= 6) {
    deltaCSI = 1.5 + (severity - 4) * 0.5; // 1.5 to 3.0
  } else if (severity >= 7 && severity <= 10) {
    deltaCSI = 3.5 + (severity - 7) * 0.5; // 3.5 to 5.0
  } else {
    deltaCSI = 1.0;
  }
  
  // Adjust by event type
  const eventTypeMultiplier: Record<EventType, number> = {
    'SANCTION': 1.2,
    'EXPORT_CONTROL': 1.1,
    'TARIFF': 0.9,
    'KINETIC': 1.5,
    'CAPITAL_CONTROL': 1.0,
    'COUP': 1.3,
    'CYBER_ATTACK': 1.0,
    'TRADE_RESTRICTION': 0.9,
    'OTHER': 0.8
  };
  
  deltaCSI *= eventTypeMultiplier[eventType] || 1.0;
  
  // Round to 1 decimal place
  return Math.round(deltaCSI * 10) / 10;
}

/**
 * Generate rationale for ΔCSI calculation
 */
function generateRationale(
  candidate: EventCandidate,
  severity: number,
  deltaCSI: number
): string {
  const parts: string[] = [];
  
  parts.push(`Event type: ${candidate.event_type} (severity ${severity}/10)`);
  parts.push(`ΔCSI calculation: Based on severity and event type, assigned +${deltaCSI}`);
  parts.push(`Detection reasoning: ${candidate.reasoning}`);
  
  if (candidate.entities.sectors.length > 0) {
    parts.push(`Affected sectors: ${candidate.entities.sectors.slice(0, 3).join(', ')}`);
  }
  
  if (candidate.entities.agencies.length > 0) {
    parts.push(`Agencies involved: ${candidate.entities.agencies.join(', ')}`);
  }
  
  parts.push(`Confidence: ${candidate.confidence.toFixed(1)}%`);
  
  return parts.join('. ');
}

/**
 * Create event from candidate
 */
export async function createEventFromCandidate(
  candidate: EventCandidate,
  autoConfirm: boolean = false
): Promise<EventRecord> {
  // Calculate severity and ΔCSI
  const severity = calculateSeverity(candidate);
  const deltaCSI = calculateDeltaCSI(severity, candidate.event_type);
  
  // Generate rationale
  const rationale = generateRationale(candidate, severity, deltaCSI);
  
  // Prepare event input
  const eventInput: CreateEventInput = {
    country: candidate.country,
    event_type: candidate.event_type,
    primary_vector: candidate.primary_vector,
    secondary_vectors: candidate.secondary_vectors,
    severity,
    delta_csi: deltaCSI,
    detected_date: candidate.detected_date,
    effective_date: undefined, // Will be set when confirmed
    description: candidate.description,
    sources: candidate.source_articles.map(a => a.link),
    rationale,
    decay_schedule: { type: 'NONE' },
    propagation_eligible: true,
    created_by: 'AUTO_DETECTION'
  };
  
  // Create event
  const event = eventStore.createEvent(eventInput);
  
  console.log(`[Auto Event Creator] ✅ Created event ${event.event_id} for ${candidate.country}`);
  
  // Auto-confirm if specified
  if (autoConfirm) {
    eventStore.transitionEventState({
      event_id: event.event_id,
      new_state: 'CONFIRMED',
      user: 'AUTO_DETECTION',
      reason: `Auto-confirmed based on high confidence (${candidate.confidence.toFixed(1)}%) and authoritative sources`
    });
    
    console.log(`[Auto Event Creator] ✅ Auto-confirmed event ${event.event_id}`);
  }
  
  return event;
}

/**
 * Create events from multiple candidates
 */
export async function createEventsFromCandidates(
  candidates: EventCandidate[],
  autoConfirmMap: Map<string, boolean>
): Promise<EventRecord[]> {
  const events: EventRecord[] = [];
  
  for (const candidate of candidates) {
    try {
      const autoConfirm = autoConfirmMap.get(candidate.candidate_id) || false;
      const event = await createEventFromCandidate(candidate, autoConfirm);
      events.push(event);
    } catch (error) {
      console.error(`[Auto Event Creator] ❌ Failed to create event for candidate ${candidate.candidate_id}:`, error);
    }
  }
  
  console.log(`[Auto Event Creator] 📊 Created ${events.length} events from ${candidates.length} candidates`);
  return events;
}

/**
 * Get event creation statistics
 */
export function getCreationStats(events: EventRecord[]): {
  total: number;
  byType: Record<string, number>;
  byCountry: Record<string, number>;
  avgSeverity: number;
  avgDeltaCSI: number;
} {
  const byType: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  let totalSeverity = 0;
  let totalDeltaCSI = 0;
  
  events.forEach(event => {
    byType[event.event_type] = (byType[event.event_type] || 0) + 1;
    byCountry[event.country] = (byCountry[event.country] || 0) + 1;
    totalSeverity += event.severity;
    totalDeltaCSI += event.delta_csi;
  });
  
  return {
    total: events.length,
    byType,
    byCountry,
    avgSeverity: events.length > 0 ? totalSeverity / events.length : 0,
    avgDeltaCSI: events.length > 0 ? totalDeltaCSI / events.length : 0
  };
}