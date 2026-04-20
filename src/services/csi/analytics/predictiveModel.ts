/**
 * Predictive Model - Risk scoring and event prediction
 * 
 * Analyzes historical patterns to predict future events and calculate risk scores.
 */

import type { EventRecord, EventType } from '@/types/csi.types';
import { getTradePartners } from '../propagation/tradeRelationships';

export interface RiskScore {
  country: string;
  overall_risk: number; // 0-100
  event_type_risks: Record<EventType, number>;
  vector_risks: Record<string, number>;
  leading_indicators: LeadingIndicator[];
  prediction_confidence: number; // 0-100
  as_of_date: string;
}

export interface LeadingIndicator {
  indicator: string;
  value: number;
  threshold: number;
  status: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

export interface EventPrediction {
  country: string;
  event_type: EventType;
  likelihood: number; // 0-100
  estimated_severity: number; // 1-10
  estimated_delta_csi: number;
  timeframe: '1-7 days' | '1-4 weeks' | '1-3 months' | '3-6 months';
  confidence: number; // 0-100
  rationale: string;
}

export interface EarlyWarningSignal {
  country: string;
  signal_type: 'ESCALATION' | 'CONTAGION' | 'PATTERN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  related_events: string[];
  detected_date: string;
}

/**
 * Calculate risk score for a country
 */
export function calculateRiskScore(country: string, events: EventRecord[]): RiskScore {
  const countryEvents = events.filter(e => e.country === country);
  const recentEvents = getRecentEvents(countryEvents, 90); // Last 90 days
  
  // Event type risks
  const event_type_risks: Record<string, number> = {};
  const eventTypeCounts: Record<string, number> = {};
  
  for (const event of recentEvents) {
    eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] || 0) + 1;
  }

  const eventTypes: EventType[] = [
    'SANCTION', 'EXPORT_CONTROL', 'TARIFF', 'KINETIC', 'CAPITAL_CONTROL',
    'COUP', 'CYBER_ATTACK', 'TRADE_RESTRICTION', 'REGULATORY_CHANGE', 'POLITICAL_INSTABILITY'
  ];

  for (const type of eventTypes) {
    const count = eventTypeCounts[type] || 0;
    const avgSeverity = count > 0
      ? recentEvents.filter(e => e.event_type === type).reduce((sum, e) => sum + e.severity, 0) / count
      : 0;
    event_type_risks[type] = Math.min(100, (count * 10 + avgSeverity * 5));
  }

  // Vector risks
  const vector_risks: Record<string, number> = {};
  const vectorCounts: Record<string, number> = {};
  
  for (const event of recentEvents) {
    vectorCounts[event.primary_vector] = (vectorCounts[event.primary_vector] || 0) + 1;
  }

  for (const [vector, count] of Object.entries(vectorCounts)) {
    vector_risks[vector] = Math.min(100, count * 15);
  }

  // Leading indicators
  const leading_indicators = calculateLeadingIndicators(country, events);

  // Overall risk: Weighted combination
  const activeEventRisk = Math.min(100, countryEvents.filter(e => e.state === 'CONFIRMED').length * 10);
  const recentEventRisk = Math.min(100, recentEvents.length * 8);
  const tradePartnerRisk = calculateTradePartnerRisk(country, events);
  const indicatorRisk = leading_indicators.reduce((sum, ind) => {
    return sum + (ind.status === 'HIGH' ? 30 : ind.status === 'MEDIUM' ? 15 : 5);
  }, 0) / Math.max(1, leading_indicators.length);

  const overall_risk = Math.min(100,
    activeEventRisk * 0.3 +
    recentEventRisk * 0.25 +
    tradePartnerRisk * 0.25 +
    indicatorRisk * 0.2
  );

  // Prediction confidence based on historical data
  const prediction_confidence = Math.min(100, countryEvents.length * 5);

  return {
    country,
    overall_risk: Math.round(overall_risk),
    event_type_risks: event_type_risks as Record<EventType, number>,
    vector_risks,
    leading_indicators,
    prediction_confidence: Math.round(prediction_confidence),
    as_of_date: new Date().toISOString()
  };
}

/**
 * Calculate leading indicators
 */
function calculateLeadingIndicators(country: string, events: EventRecord[]): LeadingIndicator[] {
  const indicators: LeadingIndicator[] = [];
  const countryEvents = events.filter(e => e.country === country);

  // Recent event frequency
  const last30Days = getRecentEvents(countryEvents, 30);
  const eventFrequency = last30Days.length;
  indicators.push({
    indicator: 'Recent Event Frequency',
    value: eventFrequency,
    threshold: 3,
    status: eventFrequency >= 5 ? 'HIGH' : eventFrequency >= 3 ? 'MEDIUM' : 'LOW',
    description: `${eventFrequency} events in last 30 days`
  });

  // Trade partner tensions
  const tradePartners = getTradePartners(country, 50);
  const partnerTensions = tradePartners.filter(partner => {
    const partnerEvents = events.filter(e => e.country === partner.to && e.state === 'CONFIRMED');
    return partnerEvents.length > 0;
  }).length;

  indicators.push({
    indicator: 'Trade Partner Tensions',
    value: partnerTensions,
    threshold: 3,
    status: partnerTensions >= 5 ? 'HIGH' : partnerTensions >= 3 ? 'MEDIUM' : 'LOW',
    description: `${partnerTensions} trade partners with active events`
  });

  // Active event severity
  const activeEvents = countryEvents.filter(e => e.state === 'CONFIRMED');
  const avgSeverity = activeEvents.length > 0
    ? activeEvents.reduce((sum, e) => sum + e.severity, 0) / activeEvents.length
    : 0;

  indicators.push({
    indicator: 'Active Event Severity',
    value: Math.round(avgSeverity * 10) / 10,
    threshold: 6,
    status: avgSeverity >= 7 ? 'HIGH' : avgSeverity >= 5 ? 'MEDIUM' : 'LOW',
    description: `Average severity: ${Math.round(avgSeverity * 10) / 10}/10`
  });

  return indicators;
}

/**
 * Calculate trade partner risk
 */
function calculateTradePartnerRisk(country: string, events: EventRecord[]): number {
  const tradePartners = getTradePartners(country, 50);
  let totalRisk = 0;

  for (const partner of tradePartners) {
    const partnerEvents = events.filter(e => 
      e.country === partner.to && 
      e.state === 'CONFIRMED'
    );
    
    const partnerRisk = partnerEvents.reduce((sum, e) => sum + e.severity, 0);
    totalRisk += (partnerRisk * partner.intensity) / 100;
  }

  return Math.min(100, totalRisk);
}

/**
 * Predict future events for a country
 */
export function predictFutureEvents(
  country: string,
  events: EventRecord[],
  maxPredictions: number = 5
): EventPrediction[] {
  const countryEvents = events.filter(e => e.country === country);
  const recentEvents = getRecentEvents(countryEvents, 180); // Last 6 months
  
  if (recentEvents.length === 0) {
    return [];
  }

  const predictions: EventPrediction[] = [];

  // Analyze historical patterns
  const eventTypeFrequency: Record<string, number> = {};
  const eventTypeSeverity: Record<string, number[]> = {};

  for (const event of recentEvents) {
    eventTypeFrequency[event.event_type] = (eventTypeFrequency[event.event_type] || 0) + 1;
    if (!eventTypeSeverity[event.event_type]) {
      eventTypeSeverity[event.event_type] = [];
    }
    eventTypeSeverity[event.event_type].push(event.severity);
  }

  // Generate predictions based on patterns
  for (const [eventType, frequency] of Object.entries(eventTypeFrequency)) {
    const likelihood = Math.min(100, (frequency / recentEvents.length) * 100);
    
    if (likelihood >= 20) { // Only predict if likelihood >= 20%
      const severities = eventTypeSeverity[eventType];
      const avgSeverity = severities.reduce((a, b) => a + b, 0) / severities.length;
      const estimatedDeltaCSI = avgSeverity * 0.5; // Rough estimate

      predictions.push({
        country,
        event_type: eventType as EventType,
        likelihood: Math.round(likelihood),
        estimated_severity: Math.round(avgSeverity),
        estimated_delta_csi: Math.round(estimatedDeltaCSI * 100) / 100,
        timeframe: determineTimeframe(frequency),
        confidence: Math.min(100, recentEvents.length * 10),
        rationale: `Historical pattern: ${frequency} occurrences in last 6 months`
      });
    }
  }

  return predictions
    .sort((a, b) => b.likelihood - a.likelihood)
    .slice(0, maxPredictions);
}

/**
 * Determine prediction timeframe based on frequency
 */
function determineTimeframe(frequency: number): EventPrediction['timeframe'] {
  if (frequency >= 10) return '1-7 days';
  if (frequency >= 5) return '1-4 weeks';
  if (frequency >= 2) return '1-3 months';
  return '3-6 months';
}

/**
 * Get early warning signals
 */
export function getEarlyWarningSignals(events: EventRecord[]): EarlyWarningSignal[] {
  const signals: EarlyWarningSignal[] = [];
  const recentEvents = getRecentEvents(events, 30);

  // Detect escalation patterns
  const escalationSignals = detectEscalation(recentEvents);
  signals.push(...escalationSignals);

  // Detect contagion patterns
  const contagionSignals = detectContagion(recentEvents, events);
  signals.push(...contagionSignals);

  return signals;
}

/**
 * Detect escalation patterns
 */
function detectEscalation(recentEvents: EventRecord[]): EarlyWarningSignal[] {
  const signals: EarlyWarningSignal[] = [];
  const countryGroups = new Map<string, EventRecord[]>();

  for (const event of recentEvents) {
    if (!countryGroups.has(event.country)) {
      countryGroups.set(event.country, []);
    }
    countryGroups.get(event.country)!.push(event);
  }

  for (const [country, events] of countryGroups.entries()) {
    if (events.length >= 3) {
      // Check if severity is increasing
      const sortedEvents = events.sort((a, b) => 
        new Date(a.detected_date).getTime() - new Date(b.detected_date).getTime()
      );
      
      const avgEarlySeverity = sortedEvents.slice(0, Math.ceil(events.length / 2))
        .reduce((sum, e) => sum + e.severity, 0) / Math.ceil(events.length / 2);
      
      const avgLateSeverity = sortedEvents.slice(Math.floor(events.length / 2))
        .reduce((sum, e) => sum + e.severity, 0) / Math.ceil(events.length / 2);

      if (avgLateSeverity > avgEarlySeverity * 1.2) {
        signals.push({
          country,
          signal_type: 'ESCALATION',
          severity: avgLateSeverity >= 7 ? 'HIGH' : avgLateSeverity >= 5 ? 'MEDIUM' : 'LOW',
          description: `Escalating tensions: ${events.length} events with increasing severity`,
          related_events: events.map(e => e.event_id),
          detected_date: new Date().toISOString()
        });
      }
    }
  }

  return signals;
}

/**
 * Detect contagion patterns
 */
function detectContagion(recentEvents: EventRecord[], allEvents: EventRecord[]): EarlyWarningSignal[] {
  const signals: EarlyWarningSignal[] = [];

  // Look for propagated events
  const propagatedEvents = recentEvents.filter(e => e.origin_event_id);
  
  if (propagatedEvents.length >= 3) {
    const originIds = new Set(propagatedEvents.map(e => e.origin_event_id));
    
    for (const originId of originIds) {
      const relatedPropagated = propagatedEvents.filter(e => e.origin_event_id === originId);
      
      if (relatedPropagated.length >= 3) {
        const originEvent = allEvents.find(e => e.event_id === originId);
        
        if (originEvent) {
          signals.push({
            country: originEvent.country,
            signal_type: 'CONTAGION',
            severity: relatedPropagated.length >= 5 ? 'HIGH' : 'MEDIUM',
            description: `Contagion detected: Event spreading to ${relatedPropagated.length} countries`,
            related_events: [originId, ...relatedPropagated.map(e => e.event_id)],
            detected_date: new Date().toISOString()
          });
        }
      }
    }
  }

  return signals;
}

/**
 * Get recent events within specified days
 */
function getRecentEvents(events: EventRecord[], days: number): EventRecord[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return events.filter(event => {
    const eventDate = new Date(event.detected_date);
    return eventDate >= cutoffDate;
  });
}

/**
 * Get risk trend over time
 */
export function getRiskTrend(
  country: string,
  events: EventRecord[],
  startDate: string,
  endDate: string,
  intervalDays: number = 7
): Array<{ date: string; risk_score: number }> {
  const trend: Array<{ date: string; risk_score: number }> = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let currentDate = new Date(start);

  while (currentDate <= end) {
    // Get events up to current date
    const eventsUpToDate = events.filter(e => new Date(e.detected_date) <= currentDate);
    const riskScore = calculateRiskScore(country, eventsUpToDate);

    trend.push({
      date: currentDate.toISOString().split('T')[0],
      risk_score: riskScore.overall_risk
    });

    currentDate.setDate(currentDate.getDate() + intervalDays);
  }

  return trend;
}