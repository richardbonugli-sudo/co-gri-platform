/**
 * Type Definitions for Company-Level Forecast Analysis
 * 
 * These types support the Strategic Forecast Baseline redesign per Appendix B.1.
 * They enable investor-focused, narrative-driven company geopolitical outlook.
 * 
 * @module forecastCompany
 */

import { Channel } from './v4Types';
import { GeopoliticalEvent } from './forecast';

/**
 * Event filtered for company relevance
 * 
 * Extends GeopoliticalEvent with company-specific relevance metadata.
 * Only events that pass relevance filtering appear in company analysis.
 */
export interface RelevantEvent extends GeopoliticalEvent {
  /** Relevance score (0-1), higher = more relevant to company */
  relevanceScore: number;
  
  /** Human-readable reasons why this event is relevant */
  relevanceReasons: string[];
  
  /** Channels through which this event affects the company */
  affectedChannels: Channel[];
  
  /** Countries where company has exposure that are affected by this event */
  affectedCountries: string[];
}

/**
 * Channel-level impact pathway
 * 
 * Explains how geopolitical events impact a specific exposure channel.
 * Forms the "Exposure Pathways" explainability layer in the UI.
 */
export interface ChannelPathway {
  /** Exposure channel being analyzed */
  channel: Channel;
  
  /** Net impact direction for this channel */
  impact: 'positive' | 'negative' | 'neutral';
  
  /** Qualitative severity of impact */
  severity: 'high' | 'medium' | 'low';
  
  /** Plain-language explanation of channel impact */
  explanation: string;
  
  /** Countries where company has exposure through this channel */
  affectedCountries: string[];
  
  /** Events affecting this channel */
  relevantEvents: string[];
}

/**
 * Bottom-line interpretation
 * 
 * Structured 4-sentence summary answering:
 * "Is the geopolitical outlook a headwind, tailwind, or mixed for this company?"
 * 
 * Required format per Appendix B.1:
 * - Sentence 1: Net direction
 * - Sentence 2: Primary driver
 * - Sentence 3: Offsets/nuance
 * - Sentence 4: Conclusion
 */
export interface BottomLineInterpretation {
  /** Net direction relative to historical baseline */
  netDirection: 'elevated' | 'reduced' | 'mixed';
  
  /** Primary geopolitical driver (e.g., "US-China tech decoupling") */
  primaryDriver: string;
  
  /** Primary exposure channel driving impact */
  primaryChannel: Channel;
  
  /** Mitigating factors or offsets (e.g., ["diversification into India"]) */
  offsets: string[];
  
  /** Overall conclusion for forecast horizon */
  conclusion: 'headwind' | 'tailwind' | 'mixed';
  
  /** Complete 4-sentence interpretation text */
  fullText: string;
}

/**
 * Quantitative support (collapsed by default)
 * 
 * Technical metrics for validation and verification.
 * Hidden by default, expandable for advanced users.
 */
export interface QuantitativeSupport {
  /** Structural CO-GRI (baseline, no forecast) */
  structuralCOGRI: number;
  
  /** Forecast-adjusted CO-GRI */
  forecastAdjustedCOGRI: number;
  
  /** Directional change indicator */
  directionalChange: 'up' | 'down' | 'neutral';
  
  /** Contribution by channel (percentage-based) */
  channelContributions: Record<Channel, number>;
  
  /** Optional: Raw CSI deltas by country */
  countryDeltas?: Record<string, number>;
  
  /** Optional: Sector multiplier applied */
  sectorMultiplier?: number;
}

/**
 * Complete company outlook
 * 
 * Top-level output structure for Strategic Forecast Baseline.
 * Contains all elements needed for investor-focused UI.
 */
export interface CompanyOutlook {
  /** Company name */
  companyName: string;
  
  /** Stock ticker symbol */
  ticker: string;
  
  /** Company sector */
  sector: string;
  
  /** Net impact assessment */
  netImpact: 'positive' | 'negative' | 'mixed';
  
  /** Forecast confidence level */
  confidence: 'high' | 'medium' | 'low';
  
  /** Forecast time horizon */
  horizon: string;
  
  /** 2-4 sentence narrative summary (primary view) */
  narrativeSummary: string;
  
  /** Events relevant to this company (filtered from full forecast) */
  relevantEvents: RelevantEvent[];
  
  /** Channel-by-channel impact analysis */
  channelPathways: ChannelPathway[];
  
  /** Required bottom-line interpretation */
  bottomLineInterpretation: BottomLineInterpretation;
  
  /** Optional quantitative details (collapsed by default) */
  quantitativeSupport?: QuantitativeSupport;
}

/**
 * Event relevance criteria
 * 
 * Defines thresholds for event relevance filtering.
 */
export interface RelevanceCriteria {
  /** Minimum exposure percentage to qualify as "has exposure" */
  minExposureThreshold: number;
  
  /** Minimum relevance score to include event */
  minRelevanceScore: number;
  
  /** Maximum number of events to display */
  maxEventsToDisplay: number;
}

/**
 * Default relevance criteria per Appendix B.1
 */
export const DEFAULT_RELEVANCE_CRITERIA: RelevanceCriteria = {
  minExposureThreshold: 0.5, // 0.5% exposure threshold
  minRelevanceScore: 0.3,    // 30% relevance score threshold
  maxEventsToDisplay: 5      // Show top 5 relevant events
};

/**
 * Channel impact weights for aggregation
 * 
 * Used to determine primary channel and net impact direction.
 */
export interface ChannelImpactWeights {
  revenue: number;
  supply: number;
  assets: number;
  financial: number;
}

/**
 * Default channel weights (equal weighting)
 */
export const DEFAULT_CHANNEL_WEIGHTS: ChannelImpactWeights = {
  revenue: 0.25,
  supply: 0.25,
  assets: 0.25,
  financial: 0.25
};
