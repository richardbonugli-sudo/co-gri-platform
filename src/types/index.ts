// Core types for the geopolitical risk assessment system

export interface Company {
  id?: string;
  name?: string;
  ticker?: string;
  sector?: string;
  geographicExposure?: Record<string, number>;
  headquarters?: string;
  marketCap?: number;
}

export interface GeopoliticalScenario {
  id: string;
  name: string;
  description: string;
  severity: number;
  probability: number;
  timeframe: 'short-term' | 'medium-term' | 'long-term';
  actorCountries?: string[];
  targetCountries?: string[];
  affectedSectors?: string[];
}

export interface ScenarioImpact {
  country: string;
  csiChange: number;
  reason: string;
  companies: Company[];
}

export interface CountryRisk {
  country: string;
  riskScore: number;
  factors: string[];
  lastUpdated: Date;
}

export interface CountryData {
  country: string;
  csi: number;
  region: string;
  politicalStability: number;
  economicRisk: number;
  socialRisk: number;
}

export interface GeographicExposure {
  country: string;
  percentage: number;
  channel: 'revenue' | 'supply' | 'assets' | 'financial';
}

export interface RiskAssessment {
  overallScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  factors: {
    political: number;
    economic: number;
    social: number;
    regulatory: number;
  };
  recommendations: string[];
}