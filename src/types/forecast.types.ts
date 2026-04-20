/**
 * Phase 5D: Geopolitical Forecast Integration - Type Definitions
 * 
 * Comprehensive type system for Cedar Owl 2026 forecast integration
 */

// ============================================================================
// CORE FORECAST TYPES
// ============================================================================

/**
 * Forecast metadata and versioning
 */
export interface ForecastMetadata {
  forecastId: string;
  version: string;
  forecastPeriod: string; // e.g., "2026"
  generatedDate: string; // ISO 8601
  nextUpdate: string; // ISO 8601
  dataSource: 'Cedar Owl' | 'Internal' | 'Hybrid';
  methodology: string;
  overallConfidence: number; // 0-1
  analystNotes?: string;
}

/**
 * Country-level forecast adjustment
 */
export interface CountryAdjustment {
  delta: number; // Change in CSI points (-10 to +10)
  drivers: string[]; // Key factors driving the change
  outlook: 'IMPROVING' | 'STABLE' | 'DETERIORATING' | 'VOLATILE';
  expectedReturn: number; // Expected return impact (-1 to +1)
  riskTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
}

/**
 * Geopolitical event forecast
 */
export interface GeopoliticalEvent {
  event: string;
  timeline: string; // e.g., "2026-Q1"
  probability: number; // 0-1
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  baseImpact: number; // CSI point impact
  affectedCountries: string[];
  sectorImpacts: Record<string, number>; // sector -> multiplier
  description: string;
  investmentImpact: string;
}

/**
 * Regional premium adjustment
 */
export interface RegionalPremium {
  [region: string]: number; // Additional risk premium (-2 to +2)
}

/**
 * Sector-specific multiplier adjustments
 */
export interface SectorMultiplier {
  [sector: string]: number; // Multiplier adjustment (0.8 to 1.2)
}

/**
 * Complete forecast data structure
 */
export interface GeopoliticalForecast {
  metadata: ForecastMetadata;
  countryAdjustments: Record<string, CountryAdjustment>;
  geopoliticalEvents: GeopoliticalEvent[];
  regionalPremiums: RegionalPremium;
  sectorMultipliers: SectorMultiplier;
}

// ============================================================================
// PREDICTIVE COGRI TYPES
// ============================================================================

/**
 * Time horizon for predictions
 */
export type TimeHorizon = '6m' | '1y' | '2y' | '5y';

/**
 * Scenario type for analysis
 */
export type ScenarioType = 'base' | 'optimistic' | 'pessimistic';

/**
 * Predictive COGRI score
 */
export interface PredictiveCOGRI {
  currentScore: number;
  predictedScore: number;
  timeHorizon: TimeHorizon;
  scenario: ScenarioType;
  confidence: number; // 0-1
  delta: number; // Change from current
  percentageChange: number;
  drivingFactors: string[];
  riskLevel: 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Very High Risk';
  calculatedAt: string; // ISO 8601
}

/**
 * Country-level predictive exposure
 */
export interface PredictiveCountryExposure {
  country: string;
  currentExposure: number;
  predictedExposure: number;
  currentRisk: number;
  predictedRisk: number;
  timeHorizon: TimeHorizon;
  scenario: ScenarioType;
  confidence: number;
  changeDrivers: string[];
}

/**
 * Scenario analysis result
 */
export interface ScenarioAnalysis {
  ticker: string;
  companyName: string;
  sector: string;
  baseCase: PredictiveCOGRI;
  optimisticCase: PredictiveCOGRI;
  pessimisticCase: PredictiveCOGRI;
  scenarioRange: {
    min: number;
    max: number;
    spread: number;
  };
  keyRisks: string[];
  keyOpportunities: string[];
  recommendedActions: string[];
  analysisDate: string; // ISO 8601
}

/**
 * Time series forecast
 */
export interface TimeSeriesForecast {
  ticker: string;
  companyName: string;
  sector: string;
  forecasts: {
    '6m': PredictiveCOGRI;
    '1y': PredictiveCOGRI;
    '2y': PredictiveCOGRI;
    '5y': PredictiveCOGRI;
  };
  trendDirection: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
  volatilityIndex: number; // 0-100
  forecastReliability: number; // 0-1
}

// ============================================================================
// FORECAST CALCULATION TYPES
// ============================================================================

/**
 * Input for predictive calculation
 */
export interface PredictiveCalculationInput {
  ticker: string;
  currentCOGRI: number;
  countryExposures: Array<{
    country: string;
    exposurePercentage: number;
    currentRisk: number;
  }>;
  sector: string;
  timeHorizon: TimeHorizon;
  scenario: ScenarioType;
  forecast: GeopoliticalForecast;
}

/**
 * Detailed calculation breakdown
 */
export interface ForecastCalculationDetail {
  country: string;
  currentCSI: number;
  forecastedCSI: number;
  delta: number;
  exposureWeight: number;
  contribution: number;
  adjustmentFactors: {
    countryAdjustment: number;
    regionalPremium: number;
    sectorMultiplier: number;
    eventImpact: number;
  };
  confidence: number;
}

/**
 * Complete predictive calculation result
 */
export interface PredictiveCalculationResult {
  predictiveCOGRI: PredictiveCOGRI;
  countryForecasts: PredictiveCountryExposure[];
  calculationDetails: ForecastCalculationDetail[];
  appliedEvents: GeopoliticalEvent[];
  confidenceFactors: {
    dataQuality: number;
    forecastReliability: number;
    timeHorizonAdjustment: number;
    scenarioConfidence: number;
    overall: number;
  };
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Forecast validation result
 */
export interface ForecastValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    validatedAt: string;
    validatorVersion: string;
    checksPerformed: string[];
  };
}

/**
 * Data quality metrics
 */
export interface ForecastDataQuality {
  completeness: number; // 0-1
  consistency: number; // 0-1
  timeliness: number; // 0-1
  accuracy: number; // 0-1
  overall: number; // 0-1
  issues: string[];
}

// ============================================================================
// UI DISPLAY TYPES
// ============================================================================

/**
 * Forecast card display data
 */
export interface ForecastCardData {
  title: string;
  currentValue: number;
  predictedValue: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  timeHorizon: TimeHorizon;
  scenario: ScenarioType;
  description: string;
}

/**
 * Scenario comparison display
 */
export interface ScenarioComparisonData {
  metric: string;
  current: number;
  baseCase: number;
  optimistic: number;
  pessimistic: number;
  unit: string;
}

/**
 * Event timeline display
 */
export interface EventTimelineData {
  event: GeopoliticalEvent;
  displayDate: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedCountriesCount: number;
  estimatedImpact: string;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

/**
 * Forecast export format
 */
export interface ForecastExport {
  metadata: ForecastMetadata;
  company: {
    ticker: string;
    name: string;
    sector: string;
  };
  currentAssessment: {
    cogriScore: number;
    riskLevel: string;
    topExposures: Array<{
      country: string;
      exposure: number;
      risk: number;
    }>;
  };
  forecasts: {
    scenarios: ScenarioAnalysis;
    timeSeries: TimeSeriesForecast;
  };
  recommendations: string[];
  exportedAt: string;
  exportFormat: 'JSON' | 'CSV' | 'PDF';
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Forecast update notification
 */
export interface ForecastUpdateNotification {
  notificationId: string;
  type: 'NEW_FORECAST' | 'FORECAST_UPDATE' | 'SIGNIFICANT_CHANGE';
  message: string;
  affectedCompanies: string[];
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  actionRequired: boolean;
}

/**
 * Forecast cache entry
 */
export interface ForecastCacheEntry {
  key: string;
  data: PredictiveCalculationResult;
  cachedAt: string;
  expiresAt: string;
  hitCount: number;
}