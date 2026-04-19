/**
 * CSI Calculation Web Worker
 * 
 * Performs heavy CSI calculations in a background thread to prevent
 * blocking the main UI thread. Especially important for extended
 * time windows (3Y, 5Y, 10Y).
 * 
 * Message Types:
 * - CALCULATE_TIME_SERIES: Calculate CSI time series for a country/global
 * - CALCULATE_STATISTICS: Calculate CSI statistics
 * - CANCEL: Cancel ongoing calculation
 * 
 * Response Types:
 * - PROGRESS: Progress update (percentage complete)
 * - RESULT: Final calculation result
 * - ERROR: Error during calculation
 */

// Type definitions for worker messages
export interface WorkerRequest {
  type: 'CALCULATE_TIME_SERIES' | 'CALCULATE_STATISTICS' | 'CANCEL';
  id: string;
  params?: {
    timeWindow: string;
    country?: string;
    dataPoints?: number;
  };
}

export interface WorkerResponse {
  type: 'PROGRESS' | 'RESULT' | 'ERROR' | 'CANCELLED';
  id: string;
  progress?: number;
  data?: CSITimeSeriesResult | CSIStatisticsResult;
  error?: string;
  calculationTime?: number;
}

export interface CSITimeSeriesResult {
  timeSeries: Array<{
    date: string;
    globalCSI: number;
    countryCSI?: number;
  }>;
  metadata: {
    timeWindow: string;
    country?: string;
    dataPoints: number;
    startDate: string;
    endDate: string;
  };
}

export interface CSIStatisticsResult {
  min: number;
  max: number;
  average: number;
  volatility: number;
  trend: 'improving' | 'worsening' | 'stable';
  totalEvents: number;
}

// Time window days mapping
const TIME_WINDOW_DAYS: Record<string, number> = {
  '7D': 7,
  '30D': 30,
  '90D': 90,
  '12M': 365,
  '3Y': 1095,
  '5Y': 1825,
  '10Y': 3650
};

// Severity weights
const SEVERITY_WEIGHTS: Record<string, number> = {
  'Critical': 1.5,
  'High': 1.2,
  'Moderate': 1.0,
  'Low': 0.7
};

// Spillover factor
const SPILLOVER_FACTOR = 0.3;

// Track active calculations for cancellation
let activeCalculationId: string | null = null;
let shouldCancel = false;

// Simplified event structure for worker
interface WorkerEvent {
  id: string;
  date: number; // timestamp
  country: string;
  relatedCountries: string[];
  deltaCSI: number;
  severity: string;
  isOngoing: boolean;
}

// Simplified country data
interface WorkerCountry {
  country: string;
  csi: number;
}

// Worker state - will be populated when data is sent
let events: WorkerEvent[] = [];
let countries: WorkerCountry[] = [];

/**
 * Apply exponential decay to event impact
 */
function applyDecay(
  eventTimestamp: number,
  asOfTimestamp: number,
  baseImpact: number,
  isOngoing: boolean
): number {
  if (isOngoing) {
    return baseImpact;
  }

  const daysSinceEvent = Math.max(0, (asOfTimestamp - eventTimestamp) / (1000 * 60 * 60 * 24));
  const halfLifeDays = 60;
  const decayFactor = Math.pow(0.5, daysSinceEvent / halfLifeDays);
  
  return baseImpact * decayFactor;
}

/**
 * Calculate CSI for a specific country at a specific date
 */
function calculateCountryCSI(
  country: string,
  timestamp: number,
  baselineCSI: number
): number {
  let eventImpact = 0;

  for (const event of events) {
    if (event.date > timestamp) continue;

    let impact = 0;
    if (event.country === country) {
      impact = applyDecay(event.date, timestamp, event.deltaCSI, event.isOngoing);
    } else if (event.relatedCountries.includes(country)) {
      impact = applyDecay(event.date, timestamp, event.deltaCSI * SPILLOVER_FACTOR, event.isOngoing);
    }

    eventImpact += impact;
  }

  return Math.max(0, Math.min(100, baselineCSI + eventImpact));
}

/**
 * Calculate global CSI at a specific date
 */
function calculateGlobalCSI(timestamp: number, baselineGlobalAverage: number): number {
  let totalEventImpact = 0;
  let eventCount = 0;

  for (const event of events) {
    if (event.date > timestamp) continue;

    const decayedImpact = applyDecay(event.date, timestamp, event.deltaCSI, event.isOngoing);
    const severityWeight = SEVERITY_WEIGHTS[event.severity] || 1.0;
    totalEventImpact += decayedImpact * severityWeight;
    eventCount++;
  }

  const scalingFactor = eventCount > 0 ? Math.min(1, eventCount / 50) : 0;
  const normalizedImpact = totalEventImpact * scalingFactor / Math.max(1, Math.sqrt(eventCount));

  return Math.max(0, Math.min(100, baselineGlobalAverage + normalizedImpact));
}

/**
 * Calculate time series with progress updates
 */
async function calculateTimeSeries(
  id: string,
  timeWindow: string,
  country?: string,
  dataPoints: number = 100
): Promise<CSITimeSeriesResult> {
  const startTime = performance.now();
  const now = Date.now();
  const days = TIME_WINDOW_DAYS[timeWindow] || 30;
  const intervalMs = (days * 24 * 60 * 60 * 1000) / dataPoints;

  // Calculate baseline
  const baselineGlobalAverage = countries.reduce((sum, c) => sum + c.csi, 0) / countries.length;
  const countryData = country ? countries.find(c => c.country === country) : null;
  const baselineCountryCSI = countryData?.csi || 50;

  const timeSeries: Array<{ date: string; globalCSI: number; countryCSI?: number }> = [];
  const startTimestamp = now - (days * 24 * 60 * 60 * 1000);

  // Process in chunks for better progress reporting
  const chunkSize = Math.max(1, Math.floor(dataPoints / 20)); // 20 progress updates
  
  for (let i = 0; i <= dataPoints; i++) {
    // Check for cancellation
    if (shouldCancel && activeCalculationId === id) {
      throw new Error('CANCELLED');
    }

    const timestamp = startTimestamp + (i * intervalMs);
    const date = new Date(timestamp);

    const globalCSI = calculateGlobalCSI(timestamp, baselineGlobalAverage);
    
    const point: { date: string; globalCSI: number; countryCSI?: number } = {
      date: date.toISOString(),
      globalCSI: parseFloat(globalCSI.toFixed(2))
    };

    if (country) {
      point.countryCSI = parseFloat(
        calculateCountryCSI(country, timestamp, baselineCountryCSI).toFixed(2)
      );
    }

    timeSeries.push(point);

    // Report progress
    if (i % chunkSize === 0 || i === dataPoints) {
      const progress = Math.round((i / dataPoints) * 100);
      self.postMessage({
        type: 'PROGRESS',
        id,
        progress
      } as WorkerResponse);

      // Yield to allow message processing
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  const calculationTime = performance.now() - startTime;
  console.log(`[Worker] Time series calculation completed in ${calculationTime.toFixed(2)}ms`);

  return {
    timeSeries,
    metadata: {
      timeWindow,
      country,
      dataPoints,
      startDate: new Date(startTimestamp).toISOString(),
      endDate: new Date(now).toISOString()
    }
  };
}

/**
 * Calculate statistics for a country
 */
function calculateStatistics(
  timeWindow: string,
  country?: string
): CSIStatisticsResult {
  const now = Date.now();
  const days = TIME_WINDOW_DAYS[timeWindow] || 30;
  const startTimestamp = now - (days * 24 * 60 * 60 * 1000);
  
  // Sample 50 points for statistics
  const samplePoints = 50;
  const intervalMs = (days * 24 * 60 * 60 * 1000) / samplePoints;

  const baselineGlobalAverage = countries.reduce((sum, c) => sum + c.csi, 0) / countries.length;
  const countryData = country ? countries.find(c => c.country === country) : null;
  const baselineCSI = countryData?.csi || baselineGlobalAverage;

  const csiValues: number[] = [];

  for (let i = 0; i <= samplePoints; i++) {
    const timestamp = startTimestamp + (i * intervalMs);
    const csi = country
      ? calculateCountryCSI(country, timestamp, baselineCSI)
      : calculateGlobalCSI(timestamp, baselineGlobalAverage);
    csiValues.push(csi);
  }

  const min = Math.min(...csiValues);
  const max = Math.max(...csiValues);
  const average = csiValues.reduce((sum, v) => sum + v, 0) / csiValues.length;

  // Calculate volatility (standard deviation)
  const squaredDiffs = csiValues.map(v => Math.pow(v - average, 2));
  const volatility = Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / csiValues.length);

  // Determine trend
  const quarterLength = Math.floor(csiValues.length / 4);
  const firstQuarterAvg = csiValues.slice(0, quarterLength).reduce((sum, v) => sum + v, 0) / quarterLength;
  const lastQuarterAvg = csiValues.slice(-quarterLength).reduce((sum, v) => sum + v, 0) / quarterLength;

  let trend: 'improving' | 'worsening' | 'stable';
  if (lastQuarterAvg < firstQuarterAvg - 2) {
    trend = 'improving';
  } else if (lastQuarterAvg > firstQuarterAvg + 2) {
    trend = 'worsening';
  } else {
    trend = 'stable';
  }

  // Count relevant events
  const relevantEvents = events.filter(e => {
    if (e.date < startTimestamp) return false;
    if (!country) return true;
    return e.country === country || e.relatedCountries.includes(country);
  });

  return {
    min: parseFloat(min.toFixed(2)),
    max: parseFloat(max.toFixed(2)),
    average: parseFloat(average.toFixed(2)),
    volatility: parseFloat(volatility.toFixed(2)),
    trend,
    totalEvents: relevantEvents.length
  };
}

/**
 * Handle incoming messages
 */
self.onmessage = async (e: MessageEvent<WorkerRequest & { events?: WorkerEvent[]; countries?: WorkerCountry[] }>) => {
  const { type, id, params } = e.data;

  // Update data if provided
  if (e.data.events) {
    events = e.data.events;
  }
  if (e.data.countries) {
    countries = e.data.countries;
  }

  switch (type) {
    case 'CALCULATE_TIME_SERIES': {
      if (!params) {
        self.postMessage({
          type: 'ERROR',
          id,
          error: 'Missing parameters'
        } as WorkerResponse);
        return;
      }

      activeCalculationId = id;
      shouldCancel = false;
      const startTime = performance.now();

      try {
        const result = await calculateTimeSeries(
          id,
          params.timeWindow,
          params.country,
          params.dataPoints || 100
        );

        const calculationTime = performance.now() - startTime;

        self.postMessage({
          type: 'RESULT',
          id,
          data: result,
          calculationTime
        } as WorkerResponse);
      } catch (error) {
        if ((error as Error).message === 'CANCELLED') {
          self.postMessage({
            type: 'CANCELLED',
            id
          } as WorkerResponse);
        } else {
          self.postMessage({
            type: 'ERROR',
            id,
            error: (error as Error).message
          } as WorkerResponse);
        }
      } finally {
        activeCalculationId = null;
      }
      break;
    }

    case 'CALCULATE_STATISTICS': {
      if (!params) {
        self.postMessage({
          type: 'ERROR',
          id,
          error: 'Missing parameters'
        } as WorkerResponse);
        return;
      }

      const startTime = performance.now();

      try {
        const result = calculateStatistics(params.timeWindow, params.country);
        const calculationTime = performance.now() - startTime;

        self.postMessage({
          type: 'RESULT',
          id,
          data: result,
          calculationTime
        } as WorkerResponse);
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          id,
          error: (error as Error).message
        } as WorkerResponse);
      }
      break;
    }

    case 'CANCEL': {
      if (activeCalculationId === id) {
        shouldCancel = true;
      }
      break;
    }

    default:
      self.postMessage({
        type: 'ERROR',
        id,
        error: `Unknown message type: ${type}`
      } as WorkerResponse);
  }
};

// Export types for TypeScript
export type { WorkerEvent, WorkerCountry };