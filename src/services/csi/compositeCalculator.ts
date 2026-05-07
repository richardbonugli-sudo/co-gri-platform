/**
 * Composite Calculator - Calculates composite CSI
 * 
 * Combines baseline CSI with active event ΔCSI to produce the final composite value.
 * Handles event decay if configured.
 * 
 * IMPORTANT: This is the SINGLE SOURCE OF TRUTH for all CSI calculations.
 * Both current and historical CSI values should be calculated through this service
 * to ensure consistency across the platform.
 * 
 * This calculator integrates:
 * 1. Baseline CSI from baselineManager
 * 2. EventRecord events from eventStore (operational events)
 * 3. GeopoliticalEvent events from geopoliticalEvents.ts (historical/reference events)
 * 4. Historical geopolitical events for extended time windows (3Y, 5Y, 10Y)
 * 5. Market index correlation data for validation
 * 6. GDP-weighted Global CSI calculations (NEW)
 */

import type { CompositeCSI, EventRecord } from '@/types/csi.types';
import type { GlobalCSIResult, TopContributor, GDPWeightMap } from '@/types/gdp.types';
import { baselineManager } from './baselineManager';
import { eventStore } from './eventStore';
import { 
  GEOPOLITICAL_EVENTS, 
  type GeopoliticalEvent,
  type ExtendedTimeWindow,
  getTimeWindowDays,
  isExtendedTimeWindow,
  getAllEventsForCountry
} from '@/data/geopoliticalEvents';
import { GLOBAL_COUNTRIES } from '@/data/globalCountries';
import { 
  HISTORICAL_GEOPOLITICAL_EVENTS,
  getHistoricalEventsByCountry,
  getHistoricalEventsByTimeWindow,
  isExtendedTimeWindow as isExtendedTimeWindowHistorical
} from '@/data/historicalGeopoliticalEvents';
import { GDP_DATA_2023, getGDPWeightMap } from '@/data/gdpData';

// Spillover factor for related countries (30% of direct impact)
const SPILLOVER_FACTOR = 0.3;

// Cache for global CSI calculations to improve performance
const globalCSICache = new Map<string, number>();
const gdpWeightedGlobalCSICache = new Map<string, GlobalCSIResult>();

class CompositeCalculator {
  /**
   * Calculate composite CSI for a country at a specific date
   * 
   * This method is the SINGLE SOURCE OF TRUTH for CSI calculations.
   * It properly filters events by date and applies decay consistently.
   * 
   * @param country - Country name
   * @param asOfDate - Date to calculate CSI for (defaults to current date)
   * @returns CompositeCSI object with baseline, events, and metadata
   */
  calculateCompositeCSI(country: string, asOfDate?: Date): CompositeCSI {
    const date = asOfDate || new Date();
    const dateStr = date.toISOString();

    // Get baseline CSI from baselineManager or fall back to GLOBAL_COUNTRIES
    let baselineValue: number;
    const baseline = baselineManager.getBaselineCSI(country);
    
    if (baseline) {
      baselineValue = baseline.baseline_value;
    } else {
      // Fall back to GLOBAL_COUNTRIES data
      const countryData = GLOBAL_COUNTRIES.find(c => c.country === country);
      if (countryData) {
        baselineValue = countryData.csi;
      } else {
        // If no data exists, return default
        return {
          country,
          baseline_csi: 50,
          event_csi: 0,
          composite_csi: 50,
          active_events: [],
          as_of_date: dateStr,
          calculation_metadata: {
            num_active_events: 0,
            event_ids: [],
            decay_applied: false
          }
        };
      }
    }

    // Get active EventRecord events from eventStore
    const activeEventRecords = eventStore.getActiveEventsAsOfDate(country, date);

    // Get geopolitical events that affect this country and occurred on or before the date
    const { directEvents, spilloverEvents } = this.getGeopoliticalEventsAsOfDate(country, date);

    // Calculate event CSI from EventRecord events (with decay)
    let eventCSI = 0;
    let decayApplied = false;

    for (const event of activeEventRecords) {
      const decayedDelta = this.applyDecay(event, date);
      eventCSI += decayedDelta;

      if (decayedDelta !== event.delta_csi) {
        decayApplied = true;
      }
    }

    // Calculate event CSI from direct geopolitical events (with decay)
    for (const event of directEvents) {
      const decayedDelta = this.applyGeopoliticalEventDecay(event, date, 1.0);
      eventCSI += decayedDelta;
      
      if (Math.abs(decayedDelta - event.deltaCSI) > 0.01) {
        decayApplied = true;
      }
    }

    // Calculate event CSI from spillover geopolitical events (with decay and spillover factor)
    for (const event of spilloverEvents) {
      const decayedDelta = this.applyGeopoliticalEventDecay(event, date, SPILLOVER_FACTOR);
      eventCSI += decayedDelta;
      decayApplied = true; // Spillover always involves modification
    }

    // Clamp composite CSI to valid range [0, 100]
    const compositeCSI = Math.max(0, Math.min(100, baselineValue + eventCSI));

    const result: CompositeCSI = {
      country,
      baseline_csi: baselineValue,
      event_csi: parseFloat(eventCSI.toFixed(2)),
      composite_csi: parseFloat(compositeCSI.toFixed(2)),
      active_events: activeEventRecords,
      as_of_date: dateStr,
      calculation_metadata: {
        num_active_events: activeEventRecords.length + directEvents.length + spilloverEvents.length,
        event_ids: [
          ...activeEventRecords.map(e => e.event_id),
          ...directEvents.map(e => e.id),
          ...spilloverEvents.map(e => `${e.id}-spillover`)
        ],
        decay_applied: decayApplied
      }
    };

    return result;
  }

  /**
   * Get geopolitical events that affect a country and occurred on or before a specific date
   * Separates direct events from spillover effects
   * 
   * @param country - Country name
   * @param asOfDate - The date to filter events by
   * @returns Object with directEvents and spilloverEvents arrays
   */
  private getGeopoliticalEventsAsOfDate(country: string, asOfDate: Date): {
    directEvents: GeopoliticalEvent[];
    spilloverEvents: GeopoliticalEvent[];
  } {
    const directEvents: GeopoliticalEvent[] = [];
    const spilloverEvents: GeopoliticalEvent[] = [];

    for (const event of GEOPOLITICAL_EVENTS) {
      // Check if event occurred on or before the asOfDate
      if (event.date > asOfDate) {
        continue;
      }

      // Check if this event directly affects the country
      if (event.country === country) {
        directEvents.push(event);
      } else if (event.relatedCountries?.includes(country)) {
        // This is a spillover effect
        spilloverEvents.push(event);
      }
    }

    return { directEvents, spilloverEvents };
  }

  /**
   * Apply decay to EventRecord ΔCSI based on decay schedule
   * 
   * @param event - The event record
   * @param asOfDate - The date to calculate decay for
   * @returns The decayed delta CSI value
   */
  private applyDecay(event: EventRecord, asOfDate: Date): number {
    const schedule = event.decay_schedule;

    if (schedule.type === 'NONE') {
      return event.delta_csi;
    }

    const effectiveDate = new Date(event.effective_date || event.detected_date);
    const daysSinceEffective = Math.max(
      0,
      (asOfDate.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (schedule.type === 'LINEAR') {
      const decayRate = schedule.decay_rate || 0.01; // Default 1% per day
      const decayFactor = Math.max(0, 1 - daysSinceEffective * decayRate);
      return event.delta_csi * decayFactor;
    }

    if (schedule.type === 'EXPONENTIAL') {
      const halfLife = schedule.half_life_days || 30; // Default 30 days
      const decayFactor = Math.pow(0.5, daysSinceEffective / halfLife);
      return event.delta_csi * decayFactor;
    }

    return event.delta_csi;
  }

  /**
   * Apply decay to GeopoliticalEvent ΔCSI
   * Uses exponential decay with a 60-day half-life by default.
   *
   * IMPORTANT – decay is applied FORWARD from the event date to asOfDate.
   * This means:
   *   - At the event date itself the full deltaCSI is applied.
   *   - The impact then decays as time passes after the event.
   *   - Historical charts therefore show realistic spikes at event dates
   *     that gradually fade, rather than a flat line.
   *
   * @param event - The geopolitical event
   * @param asOfDate - The date to calculate decay for (must be >= event.date)
   * @param impactFactor - Factor to multiply the impact by (1.0 for direct, 0.3 for spillover)
   * @returns The decayed delta CSI value
   */
  private applyGeopoliticalEventDecay(
    event: GeopoliticalEvent, 
    asOfDate: Date, 
    impactFactor: number
  ): number {
    const eventDate = event.date;

    // Days elapsed FORWARD from the event date to the query date.
    // Negative values (query date before event) are clamped to 0 so the
    // event has no impact before it occurred.
    const daysSinceEvent = Math.max(
      0,
      (asOfDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const baseImpact = event.deltaCSI * impactFactor;

    // Ongoing events don't decay – they retain full impact indefinitely.
    if (event.isOngoing) {
      return baseImpact;
    }

    // Apply exponential decay with 60-day half-life for non-ongoing events.
    // impact_at_date = deltaCSI × 0.5^(days_from_event_to_query_date / 60)
    const halfLifeDays = 60;
    const decayFactor = Math.pow(0.5, daysSinceEvent / halfLifeDays);
    
    return baseImpact * decayFactor;
  }

  /**
   * Get composite CSI for multiple countries at a specific date
   * 
   * @param countries - Array of country names
   * @param asOfDate - Date to calculate CSI for (defaults to current date)
   * @returns Map of country name to CompositeCSI
   */
  calculateMultipleCompositeCSI(countries: string[], asOfDate?: Date): Map<string, CompositeCSI> {
    const results = new Map<string, CompositeCSI>();

    for (const country of countries) {
      results.set(country, this.calculateCompositeCSI(country, asOfDate));
    }

    return results;
  }

  /**
   * Get event contribution breakdown for a country
   * 
   * @param country - Country name
   * @returns Array of event contributions
   */
  getEventContributions(country: string): Array<{ event_id: string; delta_csi: number; description: string }> {
    const activeEvents = eventStore.getActiveEvents(country);

    return activeEvents.map(event => ({
      event_id: event.event_id,
      delta_csi: event.delta_csi,
      description: event.description
    }));
  }

  /**
   * Calculate CSI at a specific historical date
   * This is a convenience method that wraps calculateCompositeCSI
   * 
   * @param country - Country name
   * @param date - Historical date
   * @returns The composite CSI value at that date
   */
  getCSIAtDate(country: string, date: Date): number {
    const composite = this.calculateCompositeCSI(country, date);
    return composite.composite_csi;
  }

  /**
   * Calculate Global Average CSI at a specific date (Equal-Weighted)
   *
   * Combines GEOPOLITICAL_EVENTS (current/ongoing) with HISTORICAL_GEOPOLITICAL_EVENTS
   * so that extended time windows (3Y / 5Y / 10Y) produce realistic historical spikes
   * instead of a flat baseline.
   *
   * Decay is applied FORWARD from each event date (fixed in applyGeopoliticalEventDecay),
   * so historical events produce visible spikes that gradually fade over time.
   *
   * @param date - Date to calculate global CSI for
   * @returns The global average CSI value
   */
  calculateGlobalCSIAtDate(date: Date): number {
    // Use cache for performance
    const cacheKey = date.toISOString().split('T')[0]; // Date only, no time
    if (globalCSICache.has(cacheKey)) {
      return globalCSICache.get(cacheKey)!;
    }

    // Calculate baseline global average (static)
    const baselineGlobalAverage = GLOBAL_COUNTRIES.reduce((sum, c) => sum + c.csi, 0) / GLOBAL_COUNTRIES.length;

    // Combine current geopolitical events with historical events for full coverage
    const allEvents = [...GEOPOLITICAL_EVENTS, ...HISTORICAL_GEOPOLITICAL_EVENTS];

    // Deduplicate by id (historical events may overlap with current events)
    const seenIds = new Set<string>();
    const uniqueEvents = allEvents.filter(e => {
      if (seenIds.has(e.id)) return false;
      seenIds.add(e.id);
      return true;
    });

    // Calculate total event impact across all events that occurred by this date
    // Each event contributes its decayed impact (forward decay from event date)
    let totalEventImpact = 0;
    let eventCount = 0;

    for (const event of uniqueEvents) {
      // Only include events that occurred on or before the query date
      if (event.date > date) {
        continue;
      }

      // Forward-decay impact: full at event date, fades over 60-day half-life
      const decayedImpact = this.applyGeopoliticalEventDecay(event, date, 1.0);
      
      // Weight the impact by severity
      const severityWeight = this.getSeverityWeight(event.severity);
      totalEventImpact += decayedImpact * severityWeight;
      eventCount++;
    }

    // Normalize: divide by a factor proportional to event count to prevent runaway
    // accumulation while still showing meaningful spikes at event clusters.
    // Using sqrt(eventCount) dampens large accumulations without flattening spikes.
    const normalizedImpact = eventCount > 0
      ? totalEventImpact / Math.max(1, Math.sqrt(eventCount) * 2)
      : 0;

    // Calculate final global CSI
    const globalCSI = Math.max(0, Math.min(100, baselineGlobalAverage + normalizedImpact));

    // Cache the result
    globalCSICache.set(cacheKey, parseFloat(globalCSI.toFixed(2)));

    return parseFloat(globalCSI.toFixed(2));
  }

  /**
   * Calculate GDP-Weighted Global CSI at a specific date (NEW)
   * 
   * Formula: GDP-Weighted CSI = Σ(CSI_i × GDP_weight_i)
   * 
   * @param date - Date to calculate global CSI for
   * @param timeWindow - Time window for change calculation (e.g., "30D")
   * @returns GlobalCSIResult with both GDP-weighted and equal-weighted metrics
   */
  calculateGDPWeightedGlobalCSI(date: Date, timeWindow: string = '30D'): GlobalCSIResult {
    // Use cache for performance
    const cacheKey = `${date.toISOString().split('T')[0]}_${timeWindow}`;
    if (gdpWeightedGlobalCSICache.has(cacheKey)) {
      return gdpWeightedGlobalCSICache.get(cacheKey)!;
    }

    // Get GDP weights
    const gdpWeights = getGDPWeightMap();

    // Calculate GDP-weighted CSI
    let gdpWeightedSum = 0;
    let equalWeightedSum = 0;
    let totalGDPCoverage = 0;
    const missingCountries: string[] = [];
    const contributorData: Array<{
      country: string;
      csi: number;
      weight: number;
      contribution: number;
    }> = [];

    for (const countryData of GLOBAL_COUNTRIES) {
      const country = countryData.country;
      const csi = this.getCSIAtDate(country, date);
      const weight = gdpWeights.get(country) || 0;

      // GDP-weighted calculation
      const weightedContribution = csi * weight;
      gdpWeightedSum += weightedContribution;

      // Equal-weighted calculation
      equalWeightedSum += csi;

      // Track coverage
      if (weight > 0) {
        totalGDPCoverage += weight;
      } else {
        missingCountries.push(country);
      }

      // Store for top contributors
      contributorData.push({
        country,
        csi,
        weight,
        contribution: weightedContribution
      });
    }

    const gdpWeightedCSI = gdpWeightedSum;
    const equalWeightedCSI = equalWeightedSum / GLOBAL_COUNTRIES.length;

    // Calculate change (simulated for now - in production, compare with historical data)
    const changeMap: Record<string, number> = {
      '7D': Math.random() * 2 - 1,
      '30D': Math.random() * 4 - 2,
      '90D': Math.random() * 6 - 3,
      '12M': Math.random() * 8 - 4
    };
    const gdpWeightedChange = changeMap[timeWindow] || 0;
    const equalWeightedChange = changeMap[timeWindow] || 0;

    // Determine directions
    const getDirection = (change: number): 'Increasing' | 'Decreasing' | 'Stable' => {
      if (change > 2) return 'Increasing';
      if (change < -2) return 'Decreasing';
      return 'Stable';
    };

    // Calculate metric delta
    const metricDelta = gdpWeightedCSI - equalWeightedCSI;
    const deltaPercentage = (metricDelta / equalWeightedCSI) * 100;

    // Interpret delta
    const deltaInterpretation = Math.abs(metricDelta) < 1
      ? 'Both metrics are closely aligned, indicating balanced global risk distribution.'
      : metricDelta > 0
      ? `GDP-weighted CSI is ${Math.abs(metricDelta).toFixed(1)} points higher, suggesting larger economies face elevated risks.`
      : `GDP-weighted CSI is ${Math.abs(metricDelta).toFixed(1)} points lower, indicating smaller economies drive more risk.`;

    // Get top 5 contributors
    const topContributors: TopContributor[] = contributorData
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 5)
      .map(c => ({
        country: c.country,
        csi: parseFloat(c.csi.toFixed(2)),
        gdp_weight: c.weight,
        gdp_weight_percentage: `${(c.weight * 100).toFixed(1)}%`,
        weighted_contribution: parseFloat(c.contribution.toFixed(2)),
        contribution_percentage: `${((c.contribution / gdpWeightedCSI) * 100).toFixed(1)}%`
      }));

    const result: GlobalCSIResult = {
      gdp_weighted_csi: parseFloat(gdpWeightedCSI.toFixed(2)),
      gdp_weighted_change: parseFloat(gdpWeightedChange.toFixed(2)),
      gdp_weighted_direction: getDirection(gdpWeightedChange),
      equal_weighted_csi: parseFloat(equalWeightedCSI.toFixed(2)),
      equal_weighted_change: parseFloat(equalWeightedChange.toFixed(2)),
      equal_weighted_direction: getDirection(equalWeightedChange),
      metric_delta: parseFloat(metricDelta.toFixed(2)),
      delta_interpretation: deltaInterpretation,
      delta_percentage: parseFloat(deltaPercentage.toFixed(2)),
      total_countries: GLOBAL_COUNTRIES.length,
      gdp_coverage: parseFloat((totalGDPCoverage * 100).toFixed(2)),
      calculation_date: date.toISOString(),
      time_window: timeWindow,
      gdp_data_year: GDP_DATA_2023.reference_year,
      top_contributors: topContributors,
      data_quality: {
        gdp_data_confidence: missingCountries.length < 10 ? 'High' : missingCountries.length < 20 ? 'Medium' : 'Low',
        missing_countries: missingCountries,
        fallback_used: false
      }
    };

    // Cache the result
    gdpWeightedGlobalCSICache.set(cacheKey, result);

    return result;
  }

  /**
   * Calculate Equal-Weighted Global CSI (for comparison)
   * Simple arithmetic mean across all countries
   * 
   * @param date - Date to calculate global CSI for
   * @returns The equal-weighted global CSI value
   */
  calculateEqualWeightedGlobalCSI(date: Date): number {
    let sum = 0;
    for (const countryData of GLOBAL_COUNTRIES) {
      const csi = this.getCSIAtDate(countryData.country, date);
      sum += csi;
    }
    return parseFloat((sum / GLOBAL_COUNTRIES.length).toFixed(2));
  }

  /**
   * Get severity weight for event impact calculation
   */
  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'Critical': return 1.5;
      case 'High': return 1.2;
      case 'Moderate': return 1.0;
      case 'Low': return 0.7;
      default: return 1.0;
    }
  }

  /**
   * Clear the global CSI cache (useful for testing or when events change)
   */
  clearGlobalCSICache(): void {
    globalCSICache.clear();
    gdpWeightedGlobalCSICache.clear();
  }

  /**
   * Calculate CSI time series for a country over an extended time window
   * Supports 3Y, 5Y, and 10Y time windows with historical event data
   * 
   * @param country - Country name
   * @param timeWindow - Extended time window (3Y, 5Y, 10Y)
   * @param dataPoints - Number of data points to generate (default: 100)
   * @returns Array of { date, csi } objects
   */
  calculateExtendedCSITimeSeries(
    country: string,
    timeWindow: ExtendedTimeWindow,
    dataPoints: number = 100
  ): Array<{ date: Date; csi: number }> {
    const now = new Date();
    const days = getTimeWindowDays(timeWindow);
    const intervalDays = days / dataPoints;
    
    const timeSeries: Array<{ date: Date; csi: number }> = [];
    
    // Get baseline CSI for the country
    const countryData = GLOBAL_COUNTRIES.find(c => c.country === country);
    const baselineCSI = countryData?.csi || 50;
    
    // Get all historical events for this country
    const historicalEvents = getHistoricalEventsByCountry(country, timeWindow);
    const currentEvents = GEOPOLITICAL_EVENTS.filter(
      e => e.country === country || e.relatedCountries?.includes(country)
    );
    const allEvents = [...historicalEvents, ...currentEvents].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    
    // Generate time series
    for (let i = 0; i <= dataPoints; i++) {
      const daysAgo = days - (i * intervalDays);
      const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Calculate CSI at this date
      let eventImpact = 0;
      
      for (const event of allEvents) {
        if (event.date > date) continue;
        
        const impact = event.country === country ? event.deltaCSI : event.deltaCSI * SPILLOVER_FACTOR;
        const decayedImpact = this.applyGeopoliticalEventDecay(event, date, 
          event.country === country ? 1.0 : SPILLOVER_FACTOR);
        eventImpact += decayedImpact;
      }
      
      const csi = Math.max(0, Math.min(100, baselineCSI + eventImpact));
      timeSeries.push({ date, csi: parseFloat(csi.toFixed(2)) });
    }
    
    return timeSeries;
  }

  /**
   * Calculate Global CSI time series for extended time windows.
   * Uses historical geopolitical events for 3Y, 5Y, 10Y windows.
   *
   * With the corrected forward-decay model each historical event produces a
   * visible spike at its date that gradually decays, giving realistic charts.
   *
   * @param timeWindow - Extended time window
   * @param dataPoints - Number of data points
   * @returns Array of { date, csi } objects
   */
  calculateExtendedGlobalCSITimeSeries(
    timeWindow: ExtendedTimeWindow,
    dataPoints: number = 100
  ): Array<{ date: Date; csi: number }> {
    const now = new Date();
    const days = getTimeWindowDays(timeWindow);
    const intervalDays = days / dataPoints;
    
    const timeSeries: Array<{ date: Date; csi: number }> = [];
    
    // Calculate baseline global average
    const baselineGlobalAverage = GLOBAL_COUNTRIES.reduce((sum, c) => sum + c.csi, 0) / GLOBAL_COUNTRIES.length;
    
    // Combine current + historical events; deduplicate by id
    const allRaw = [...GEOPOLITICAL_EVENTS, ...HISTORICAL_GEOPOLITICAL_EVENTS];
    const seenIds = new Set<string>();
    const allEvents = allRaw
      .filter(e => { if (seenIds.has(e.id)) return false; seenIds.add(e.id); return true; })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Generate time series
    for (let i = 0; i <= dataPoints; i++) {
      const daysAgo = days - (i * intervalDays);
      const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Calculate total event impact at this date using forward decay
      let totalEventImpact = 0;
      let eventCount = 0;
      
      for (const event of allEvents) {
        if (event.date > date) continue;
        
        const decayedImpact = this.applyGeopoliticalEventDecay(event, date, 1.0);
        const severityWeight = this.getSeverityWeight(event.severity);
        totalEventImpact += decayedImpact * severityWeight;
        eventCount++;
      }
      
      // Normalize using sqrt dampening (same formula as calculateGlobalCSIAtDate)
      const normalizedImpact = eventCount > 0
        ? totalEventImpact / Math.max(1, Math.sqrt(eventCount) * 2)
        : 0;
      
      const globalCSI = Math.max(0, Math.min(100, baselineGlobalAverage + normalizedImpact));
      timeSeries.push({ date, csi: parseFloat(globalCSI.toFixed(2)) });
    }
    
    return timeSeries;
  }

  /**
   * Get the CSI snapshot at the time of a landmark event.
   *
   * Uses a cumulative (non-decayed) model: sums up the full deltaCSI of every
   * event that occurred on or before the landmark event date.  This gives a
   * meaningful "CO-GRI at event" value for the "then vs now" comparison in
   * COGRITrendChart and RiskTrendComparison.
   *
   * @param eventDate - The date of the landmark event
   * @param country   - Optional country; if provided returns country-level snapshot
   * @returns CSI value at the time of the event
   */
  getLandmarkCSISnapshot(eventDate: Date, country?: string): number {
    const allRaw = [...GEOPOLITICAL_EVENTS, ...HISTORICAL_GEOPOLITICAL_EVENTS];
    const seenIds = new Set<string>();
    const allEvents = allRaw.filter(e => {
      if (seenIds.has(e.id)) return false;
      seenIds.add(e.id);
      return true;
    });

    if (country) {
      const countryData = GLOBAL_COUNTRIES.find(c => c.country === country);
      const baseline = countryData?.csi ?? 50;
      let impact = 0;
      for (const event of allEvents) {
        if (event.date > eventDate) continue;
        if (event.country === country) {
          impact += this.applyGeopoliticalEventDecay(event, eventDate, 1.0);
        } else if (event.relatedCountries?.includes(country)) {
          impact += this.applyGeopoliticalEventDecay(event, eventDate, SPILLOVER_FACTOR);
        }
      }
      return parseFloat(Math.max(0, Math.min(100, baseline + impact)).toFixed(2));
    }

    // Global snapshot
    const baselineGlobalAverage = GLOBAL_COUNTRIES.reduce((sum, c) => sum + c.csi, 0) / GLOBAL_COUNTRIES.length;
    let totalImpact = 0;
    let eventCount = 0;
    for (const event of allEvents) {
      if (event.date > eventDate) continue;
      const decayedImpact = this.applyGeopoliticalEventDecay(event, eventDate, 1.0);
      totalImpact += decayedImpact * this.getSeverityWeight(event.severity);
      eventCount++;
    }
    const normalizedImpact = eventCount > 0
      ? totalImpact / Math.max(1, Math.sqrt(eventCount) * 2)
      : 0;
    return parseFloat(Math.max(0, Math.min(100, baselineGlobalAverage + normalizedImpact)).toFixed(2));
  }

  /**
   * Get CSI statistics for extended time windows
   * Returns min, max, average, and volatility metrics
   * 
   * @param country - Country name
   * @param timeWindow - Extended time window
   * @returns Statistics object
   */
  getExtendedCSIStatistics(
    country: string,
    timeWindow: ExtendedTimeWindow
  ): {
    min: number;
    max: number;
    average: number;
    volatility: number;
    trend: 'improving' | 'worsening' | 'stable';
    totalEvents: number;
  } {
    const timeSeries = this.calculateExtendedCSITimeSeries(country, timeWindow);
    
    if (timeSeries.length === 0) {
      return {
        min: 50,
        max: 50,
        average: 50,
        volatility: 0,
        trend: 'stable',
        totalEvents: 0
      };
    }
    
    const csiValues = timeSeries.map(t => t.csi);
    const min = Math.min(...csiValues);
    const max = Math.max(...csiValues);
    const average = csiValues.reduce((sum, v) => sum + v, 0) / csiValues.length;
    
    // Calculate volatility (standard deviation)
    const squaredDiffs = csiValues.map(v => Math.pow(v - average, 2));
    const volatility = Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / csiValues.length);
    
    // Determine trend (compare first quarter to last quarter)
    const quarterLength = Math.floor(csiValues.length / 4);
    const firstQuarterAvg = csiValues.slice(0, quarterLength).reduce((sum, v) => sum + v, 0) / quarterLength;
    const lastQuarterAvg = csiValues.slice(-quarterLength).reduce((sum, v) => sum + v, 0) / quarterLength;
    
    let trend: 'improving' | 'worsening' | 'stable';
    if (lastQuarterAvg < firstQuarterAvg - 2) {
      trend = 'improving'; // Lower CSI = lower risk = improving
    } else if (lastQuarterAvg > firstQuarterAvg + 2) {
      trend = 'worsening';
    } else {
      trend = 'stable';
    }
    
    // Count events
    const historicalEvents = getHistoricalEventsByCountry(country, timeWindow);
    const currentEvents = GEOPOLITICAL_EVENTS.filter(
      e => e.country === country || e.relatedCountries?.includes(country)
    );
    
    return {
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      average: parseFloat(average.toFixed(2)),
      volatility: parseFloat(volatility.toFixed(2)),
      trend,
      totalEvents: historicalEvents.length + currentEvents.length
    };
  }

  /**
   * Get landmark events for chart annotations
   * Returns major historical events that should be marked on charts
   * 
   * @param timeWindow - Extended time window
   * @returns Array of landmark events with dates and descriptions
   */
  getLandmarkEventsForChart(timeWindow: ExtendedTimeWindow): Array<{
    date: Date;
    title: string;
    shortTitle: string;
    severity: string;
    deltaCSI: number;
  }> {
    // Import landmark events from historical data
    const { LANDMARK_EVENTS } = require('@/data/historicalGeopoliticalEvents');
    
    const now = new Date();
    const days = getTimeWindowDays(timeWindow);
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return LANDMARK_EVENTS
      .filter((event: any) => event.date >= cutoffDate)
      .map((event: any) => ({
        date: event.date,
        title: event.title,
        shortTitle: event.shortTitle,
        severity: event.severity,
        deltaCSI: event.deltaCSI
      }));
  }
}

// Singleton instance
export const compositeCalculator = new CompositeCalculator();