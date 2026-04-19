/**
 * Forecast Services - Public API
 * 
 * Exports all forecast analysis services for Strategic Forecast Baseline.
 * 
 * @module forecast
 */

// Main orchestrator
export { generateCompanyOutlook } from './companyOutlookAggregator';

// Individual services (for advanced usage)
export { 
  filterRelevantEvents, 
  getTopRelevantEvents,
  type CompanyExposureData 
} from './eventRelevanceFilter';

export { 
  analyzeExposurePathways 
} from './exposurePathwayAnalyzer';

export { 
  generateBottomLineInterpretation,
  type BottomLineInput 
} from './bottomLineGenerator';

// Re-export types
export type {
  CompanyOutlook,
  RelevantEvent,
  ChannelPathway,
  BottomLineInterpretation,
  QuantitativeSupport,
  RelevanceCriteria
} from '@/types/forecastCompany';
