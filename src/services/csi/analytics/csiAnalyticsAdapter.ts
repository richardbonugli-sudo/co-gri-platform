/**
 * CSI Analytics Adapter
 * 
 * Bridges CSIEvent interface with analytics modules that expect EventRecord.
 * Provides simplified analytics specifically for the CSI dashboard.
 */

import type { CSIEvent } from '../eventStore';

export interface CorrelationResult {
  event1: CSIEvent;
  event2: CSIEvent;
  correlationType: 'temporal' | 'geographic' | 'sector' | 'causal';
  strength: number; // 0-100
  description: string;
}

export interface ImpactAnalysis {
  eventId: string;
  country: string;
  compositeScore: number; // 0-100
  geographicReach: number;
  sectorBreadth: number;
  severityImpact: number;
  affectedSectors: string[];
}

export interface RiskPrediction {
  country: string;
  overallRisk: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  eventTypeRisks: Record<string, number>;
  confidence: number; // 0-100
  topRiskFactors: string[];
}

export interface EarlyWarning {
  country: string;
  warningType: 'ESCALATION' | 'CONTAGION' | 'PATTERN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  relatedEvents: string[];
  detectedDate: string;
}

/**
 * Detect correlations between events
 */
export function detectCorrelations(events: CSIEvent[]): CorrelationResult[] {
  const correlations: CorrelationResult[] = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const event1 = events[i];
      const event2 = events[j];

      // Temporal correlation (within 7 days)
      const temporal = checkTemporalCorrelation(event1, event2);
      if (temporal) correlations.push(temporal);

      // Geographic correlation (same country or related regions)
      const geographic = checkGeographicCorrelation(event1, event2);
      if (geographic) correlations.push(geographic);

      // Sector correlation (common affected sectors)
      const sector = checkSectorCorrelation(event1, event2);
      if (sector) correlations.push(sector);
    }
  }

  return correlations.sort((a, b) => b.strength - a.strength);
}

function checkTemporalCorrelation(event1: CSIEvent, event2: CSIEvent): CorrelationResult | null {
  const daysDiff = Math.abs(
    (event2.timestamp.getTime() - event1.timestamp.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff <= 7) {
    const strength = Math.max(0, 100 - (daysDiff / 7) * 100);
    return {
      event1,
      event2,
      correlationType: 'temporal',
      strength: Math.round(strength),
      description: `Events occurred ${Math.round(daysDiff)} days apart`
    };
  }

  return null;
}

function checkGeographicCorrelation(event1: CSIEvent, event2: CSIEvent): CorrelationResult | null {
  if (event1.country === event2.country) {
    return {
      event1,
      event2,
      correlationType: 'geographic',
      strength: 100,
      description: `Both events in ${event1.country}`
    };
  }

  // Check regional proximity (simplified)
  const asianCountries = ['China', 'Japan', 'South Korea', 'Taiwan', 'Vietnam', 'India'];
  const europeanCountries = ['Germany', 'United Kingdom', 'France', 'Italy'];
  const americanCountries = ['United States', 'Brazil', 'Canada', 'Mexico'];

  const inSameRegion = 
    (asianCountries.includes(event1.country) && asianCountries.includes(event2.country)) ||
    (europeanCountries.includes(event1.country) && europeanCountries.includes(event2.country)) ||
    (americanCountries.includes(event1.country) && americanCountries.includes(event2.country));

  if (inSameRegion) {
    return {
      event1,
      event2,
      correlationType: 'geographic',
      strength: 60,
      description: `Events in same region: ${event1.country} and ${event2.country}`
    };
  }

  return null;
}

function checkSectorCorrelation(event1: CSIEvent, event2: CSIEvent): CorrelationResult | null {
  const sectors1 = new Set(event1.affectedSectors);
  const sectors2 = new Set(event2.affectedSectors);

  const commonSectors = Array.from(sectors1).filter(s => sectors2.has(s));

  if (commonSectors.length > 0) {
    const strength = (commonSectors.length / Math.max(sectors1.size, sectors2.size)) * 100;
    return {
      event1,
      event2,
      correlationType: 'sector',
      strength: Math.round(strength),
      description: `Both affect ${commonSectors.join(', ')}`
    };
  }

  return null;
}

/**
 * Analyze impact of events
 */
export function analyzeImpact(events: CSIEvent[]): ImpactAnalysis[] {
  return events.map(event => {
    // Geographic reach (simplified - based on country importance)
    const majorEconomies = ['United States', 'China', 'Japan', 'Germany', 'United Kingdom'];
    const geographicReach = majorEconomies.includes(event.country) ? 80 : 50;

    // Sector breadth
    const sectorBreadth = Math.min(100, (event.affectedSectors.length / 5) * 100);

    // Severity impact
    const severityMap = { low: 25, medium: 50, high: 75, critical: 100 };
    const severityImpact = severityMap[event.severity] || 50;

    // Composite score (weighted average)
    const compositeScore = 
      geographicReach * 0.3 +
      sectorBreadth * 0.3 +
      severityImpact * 0.4;

    return {
      eventId: event.id,
      country: event.country,
      compositeScore: Math.round(compositeScore),
      geographicReach,
      sectorBreadth,
      severityImpact,
      affectedSectors: event.affectedSectors
    };
  }).sort((a, b) => b.compositeScore - a.compositeScore);
}

/**
 * Generate risk predictions by country
 */
export function generateRiskPredictions(events: CSIEvent[]): RiskPrediction[] {
  const countryMap = new Map<string, CSIEvent[]>();

  // Group events by country
  events.forEach(event => {
    if (!countryMap.has(event.country)) {
      countryMap.set(event.country, []);
    }
    countryMap.get(event.country)!.push(event);
  });

  const predictions: RiskPrediction[] = [];

  countryMap.forEach((countryEvents, country) => {
    // Calculate event type risks
    const eventTypeRisks: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    countryEvents.forEach(event => {
      typeCounts[event.eventType] = (typeCounts[event.eventType] || 0) + 1;
    });

    Object.entries(typeCounts).forEach(([type, count]) => {
      eventTypeRisks[type] = Math.min(100, count * 20);
    });

    // Calculate overall risk
    const recentEvents = countryEvents.filter(e => {
      const daysSince = (Date.now() - e.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 90;
    });

    const severityScore = countryEvents.reduce((sum, e) => {
      const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
      return sum + (severityMap[e.severity] || 1);
    }, 0);

    const overallRisk = Math.min(100, 
      (recentEvents.length * 15) + 
      (severityScore * 5)
    );

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (overallRisk >= 75) riskLevel = 'CRITICAL';
    else if (overallRisk >= 50) riskLevel = 'HIGH';
    else if (overallRisk >= 25) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    // Top risk factors
    const topRiskFactors: string[] = [];
    if (recentEvents.length >= 3) topRiskFactors.push('High event frequency');
    if (countryEvents.some(e => e.severity === 'critical')) topRiskFactors.push('Critical events present');
    if (Object.keys(eventTypeRisks).length >= 3) topRiskFactors.push('Multiple event types');

    predictions.push({
      country,
      overallRisk: Math.round(overallRisk),
      riskLevel,
      eventTypeRisks,
      confidence: Math.min(100, countryEvents.length * 10),
      topRiskFactors
    });
  });

  return predictions.sort((a, b) => b.overallRisk - a.overallRisk);
}

/**
 * Detect early warning signals
 */
export function detectEarlyWarnings(events: CSIEvent[]): EarlyWarning[] {
  const warnings: EarlyWarning[] = [];
  const recentEvents = events.filter(e => {
    const daysSince = (Date.now() - e.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  });

  // Group by country
  const countryGroups = new Map<string, CSIEvent[]>();
  recentEvents.forEach(event => {
    if (!countryGroups.has(event.country)) {
      countryGroups.set(event.country, []);
    }
    countryGroups.get(event.country)!.push(event);
  });

  // Detect escalation patterns
  countryGroups.forEach((countryEvents, country) => {
    if (countryEvents.length >= 3) {
      const sorted = countryEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
      
      const earlyAvg = sorted.slice(0, Math.ceil(sorted.length / 2))
        .reduce((sum, e) => sum + (severityMap[e.severity] || 1), 0) / Math.ceil(sorted.length / 2);
      
      const lateAvg = sorted.slice(Math.floor(sorted.length / 2))
        .reduce((sum, e) => sum + (severityMap[e.severity] || 1), 0) / Math.ceil(sorted.length / 2);

      if (lateAvg > earlyAvg * 1.2) {
        warnings.push({
          country,
          warningType: 'ESCALATION',
          severity: lateAvg >= 3 ? 'HIGH' : lateAvg >= 2 ? 'MEDIUM' : 'LOW',
          description: `Escalating tensions: ${countryEvents.length} events with increasing severity`,
          relatedEvents: countryEvents.map(e => e.id),
          detectedDate: new Date().toISOString()
        });
      }
    }
  });

  // Detect contagion patterns (events spreading across related countries)
  const asianCountries = ['China', 'Japan', 'South Korea', 'Taiwan', 'Vietnam', 'India'];
  const asianEvents = recentEvents.filter(e => asianCountries.includes(e.country));
  
  if (asianEvents.length >= 4) {
    const affectedCountries = new Set(asianEvents.map(e => e.country));
    if (affectedCountries.size >= 3) {
      warnings.push({
        country: 'Asia Region',
        warningType: 'CONTAGION',
        severity: affectedCountries.size >= 4 ? 'HIGH' : 'MEDIUM',
        description: `Regional contagion: Events spreading across ${affectedCountries.size} Asian countries`,
        relatedEvents: asianEvents.map(e => e.id),
        detectedDate: new Date().toISOString()
      });
    }
  }

  return warnings;
}

/**
 * Get correlation matrix data for visualization
 */
export function getCorrelationMatrix(events: CSIEvent[]): Array<{
  event1Id: string;
  event2Id: string;
  event1Country: string;
  event2Country: string;
  strength: number;
  type: string;
}> {
  const correlations = detectCorrelations(events);
  
  return correlations.map(corr => ({
    event1Id: corr.event1.id,
    event2Id: corr.event2.id,
    event1Country: corr.event1.country,
    event2Country: corr.event2.country,
    strength: corr.strength,
    type: corr.correlationType
  }));
}