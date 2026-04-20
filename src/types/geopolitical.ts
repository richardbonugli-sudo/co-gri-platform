/**
 * Geopolitical Risk Assessment Types
 * 
 * Type definitions for the CO-GRI v3.4 system
 */

export interface GeographicExposure {
  country: string;
  exposurePercentage: number;
  riskScore: number;
  channels: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
  };
}

export interface ChannelBreakdown {
  channel: string;
  country: string;
  rawWeight: number;
  adjustedWeight: number;
  confidenceScore: number;
  dataSources: string[];
  fallbackType: 'SSF' | 'RF' | 'GF' | 'Evidence';
}

export interface GeopoliticalRisk {
  country: string;
  riskScore: number;
  riskFactors: string[];
  lastUpdated: string;
}

export interface ChannelCalculationDetail {
  step: string;
  formula: string;
  inputs: Record<string, number>;
  output: number;
}

export interface CalculationStep {
  step: string;
  formula: string;
  inputs: Record<string, number>;
  output: number;
}

export interface ChannelCalculationBreakdown {
  channel: string;
  country: string;
  rawWeight: number;
  adjustedWeight: number;
  confidenceScore: number;
  dataSources: string[];
  fallbackType: 'SSF' | 'RF' | 'GF' | 'Evidence';
  calculations: CalculationStep[];
  evidence: string[];
}

export type FallbackType = 'SSF' | 'RF' | 'GF' | 'Evidence';
export type EvidenceStatus = 'evidence' | 'high_confidence_estimate' | 'known_zero' | 'fallback';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface CountryRiskProfile {
  country: string;
  baseRiskScore: number;
  riskFactors: {
    political: number;
    economic: number;
    security: number;
    regulatory: number;
  };
  lastUpdated: string;
}

export interface SectorRiskMultiplier {
  sector: string;
  multiplier: number;
  reasoning: string;
  lastUpdated: string;
}