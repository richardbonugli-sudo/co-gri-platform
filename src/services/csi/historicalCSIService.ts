/**
 * Historical CSI Service
 * 
 * Manages historical CSI snapshots and calculates actual CSI changes over time.
 * Integrates with geopolitical events to provide event-driven CSI tracking.
 * 
 * IMPORTANT: This service now uses the compositeCalculator as the SINGLE SOURCE
 * OF TRUTH for all CSI calculations, ensuring consistency between historical
 * and current values.
 */

import { GLOBAL_COUNTRIES } from '@/data/globalCountries';
import { 
  GEOPOLITICAL_EVENTS, 
  getEventsByTimeWindow,
  calculateCountryCSIChange,
  type GeopoliticalEvent 
} from '@/data/geopoliticalEvents';
import { compositeCalculator } from './compositeCalculator';

export interface CSISnapshot {
  country: string;
  csi: number;
  date: Date;
  events: string[]; // Event IDs that contributed to this CSI
}

export interface CSIChange {
  country: string;
  region: string;
  currentCSI: number;
  previousCSI: number;
  change: number;
  percentChange: number;
  direction: 'up' | 'down' | 'stable';
  contributingEvents: GeopoliticalEvent[];
}

class HistoricalCSIService {
  private snapshots: Map<string, CSISnapshot[]> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initializeHistoricalData();
  }

  /**
   * Initialize historical CSI data based on baseline values and events
   */
  private initializeHistoricalData(): void {
    if (this.initialized) return;

    // Create baseline snapshots for all countries (12 months ago)
    const baselineDate = new Date();
    baselineDate.setFullYear(baselineDate.getFullYear() - 1);

    GLOBAL_COUNTRIES.forEach(country => {
      const snapshots: CSISnapshot[] = [];
      
      // Add baseline snapshot
      snapshots.push({
        country: country.country,
        csi: country.csi,
        date: new Date(baselineDate),
        events: []
      });

      this.snapshots.set(country.country, snapshots);
    });

    // Apply events chronologically to build historical snapshots
    this.applyEventsToHistory();
    
    this.initialized = true;
    console.log('[Historical CSI Service] ✅ Initialized with historical data');
  }

  /**
   * Apply geopolitical events to historical CSI values
   */
  private applyEventsToHistory(): void {
    // Sort events by date (oldest first)
    const sortedEvents = [...GEOPOLITICAL_EVENTS].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    // Process each event and update country CSI
    sortedEvents.forEach(event => {
      this.applyEventToCountry(event.country, event);
      
      // Apply spillover to related countries
      event.relatedCountries?.forEach(relatedCountry => {
        this.applyEventToCountry(relatedCountry, event, 0.3); // 30% spillover
      });
    });
  }

  /**
   * Apply a single event to a country's CSI history
   */
  private applyEventToCountry(
    country: string, 
    event: GeopoliticalEvent, 
    spilloverFactor: number = 1.0
  ): void {
    const countrySnapshots = this.snapshots.get(country);
    if (!countrySnapshots) return;

    const lastSnapshot = countrySnapshots[countrySnapshots.length - 1];
    const impact = event.deltaCSI * spilloverFactor;
    const newCSI = Math.max(0, Math.min(100, lastSnapshot.csi + impact));

    // Only add snapshot if there's meaningful change
    if (Math.abs(impact) > 0.1) {
      countrySnapshots.push({
        country,
        csi: newCSI,
        date: new Date(event.date),
        events: [...lastSnapshot.events, event.id]
      });
    }
  }

  /**
   * Get CSI value for a country at a specific date
   * 
   * UNIFIED APPROACH: Uses compositeCalculator for consistency with current CSI values.
   * This ensures that historical and current values use the same calculation logic,
   * including proper event filtering and decay application.
   * 
   * @param country - Country name
   * @param date - The date to get CSI for
   * @returns The CSI value at that date
   */
  getCSIAtDate(country: string, date: Date): number {
    // Use the compositeCalculator as the single source of truth
    // This ensures consistency between historical and current CSI calculations
    return compositeCalculator.getCSIAtDate(country, date);
  }

  /**
   * Get current CSI for a country (includes all event impacts)
   * Uses compositeCalculator via getCountryShockIndex for consistency with the rest of the platform
   */
  getCurrentCSI(country: string): number {
    // Use the compositeCalculator directly for current CSI
    const composite = compositeCalculator.calculateCompositeCSI(country);
    return composite.composite_csi;
  }

  /**
   * Calculate CSI change for a country over a time window
   */
  calculateCSIChange(country: string, timeWindow: '7D' | '30D' | '90D' | '12M'): CSIChange {
    const countryData = GLOBAL_COUNTRIES.find(c => c.country === country);
    if (!countryData) {
      return {
        country,
        region: 'Unknown',
        currentCSI: 50,
        previousCSI: 50,
        change: 0,
        percentChange: 0,
        direction: 'stable',
        contributingEvents: []
      };
    }

    // Calculate time window in milliseconds
    const now = new Date();
    let windowMs: number;
    switch (timeWindow) {
      case '7D': windowMs = 7 * 24 * 60 * 60 * 1000; break;
      case '30D': windowMs = 30 * 24 * 60 * 60 * 1000; break;
      case '90D': windowMs = 90 * 24 * 60 * 60 * 1000; break;
      case '12M': windowMs = 365 * 24 * 60 * 60 * 1000; break;
      default: windowMs = 30 * 24 * 60 * 60 * 1000;
    }

    const pastDate = new Date(now.getTime() - windowMs);
    
    // Get CSI values using the unified compositeCalculator approach
    const currentCSI = this.getCurrentCSI(country);
    const previousCSI = this.getCSIAtDate(country, pastDate);
    
    // Calculate change using event-based approach
    const eventBasedChange = calculateCountryCSIChange(country, timeWindow);
    
    // Use event-based change if available, otherwise calculate from snapshots
    const change = eventBasedChange.events.length > 0 
      ? eventBasedChange.totalChange 
      : parseFloat((currentCSI - previousCSI).toFixed(1));
    
    const percentChange = previousCSI > 0 
      ? parseFloat(((change / previousCSI) * 100).toFixed(1)) 
      : 0;

    // Determine direction
    let direction: 'up' | 'down' | 'stable';
    if (Math.abs(change) < 0.5) {
      direction = 'stable';
    } else if (change > 0) {
      direction = 'up';
    } else {
      direction = 'down';
    }

    return {
      country,
      region: countryData.region,
      currentCSI,
      previousCSI,
      change,
      percentChange,
      direction,
      contributingEvents: eventBasedChange.events
    };
  }

  /**
   * Get top risk movers for a time window
   */
  getTopRiskMovers(timeWindow: '7D' | '30D' | '90D' | '12M', maxCountries: number = 10): CSIChange[] {
    // Get all countries with events in the time window
    const windowEvents = getEventsByTimeWindow(timeWindow);
    const affectedCountries = new Set<string>();
    
    windowEvents.forEach(event => {
      affectedCountries.add(event.country);
      event.relatedCountries?.forEach(c => affectedCountries.add(c));
    });

    // Calculate changes for affected countries
    const changes: CSIChange[] = [];
    
    affectedCountries.forEach(country => {
      const change = this.calculateCSIChange(country, timeWindow);
      if (Math.abs(change.change) > 0.1) { // Filter out negligible changes
        changes.push(change);
      }
    });

    // Sort by absolute change value
    changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    return changes.slice(0, maxCountries);
  }

  /**
   * Get all CSI snapshots for a country
   */
  getCountryHistory(country: string): CSISnapshot[] {
    return this.snapshots.get(country) || [];
  }

  /**
   * Get summary statistics for a time window
   */
  getWindowStatistics(timeWindow: '7D' | '30D' | '90D' | '12M'): {
    totalEvents: number;
    increasingCountries: number;
    decreasingCountries: number;
    averageChange: number;
    topIncreaser: { country: string; change: number } | null;
    topDecreaser: { country: string; change: number } | null;
  } {
    const movers = this.getTopRiskMovers(timeWindow, 50);
    const windowEvents = getEventsByTimeWindow(timeWindow);
    
    const increasing = movers.filter(m => m.direction === 'up');
    const decreasing = movers.filter(m => m.direction === 'down');
    
    const avgChange = movers.length > 0 
      ? movers.reduce((sum, m) => sum + m.change, 0) / movers.length 
      : 0;

    return {
      totalEvents: windowEvents.length,
      increasingCountries: increasing.length,
      decreasingCountries: decreasing.length,
      averageChange: parseFloat(avgChange.toFixed(1)),
      topIncreaser: increasing.length > 0 
        ? { country: increasing[0].country, change: increasing[0].change }
        : null,
      topDecreaser: decreasing.length > 0 
        ? { country: decreasing[0].country, change: decreasing[0].change }
        : null
    };
  }
}

// Singleton instance
export const historicalCSIService = new HistoricalCSIService();

// Export convenience functions
export const getCSIAtDate = (country: string, date: Date) => 
  historicalCSIService.getCSIAtDate(country, date);

export const getCurrentCSI = (country: string) => 
  historicalCSIService.getCurrentCSI(country);

export const calculateCSIChange = (country: string, timeWindow: '7D' | '30D' | '90D' | '12M') => 
  historicalCSIService.calculateCSIChange(country, timeWindow);

export const getTopRiskMovers = (timeWindow: '7D' | '30D' | '90D' | '12M', maxCountries?: number) => 
  historicalCSIService.getTopRiskMovers(timeWindow, maxCountries);

export const getWindowStatistics = (timeWindow: '7D' | '30D' | '90D' | '12M') => 
  historicalCSIService.getWindowStatistics(timeWindow);