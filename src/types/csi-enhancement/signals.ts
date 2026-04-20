/**
 * Signal Type Definitions for CSI Enhancement
 * Phase 1 Implementation
 */

/**
 * Raw signal from external data source (before processing)
 */
export interface RawSignal {
  sourceId: string;
  rawContent: string;
  timestamp: Date;
  url?: string;
  metadata: Record<string, any>;
}

/**
 * Structured signal after parsing and enrichment
 */
export interface StructuredSignal {
  signalId: string; // UUID
  sourceId: string;
  detectedAt: Date;
  
  // Geographic Attribution
  countries: string[]; // ISO 3166-1 alpha-2 codes
  regions?: string[];
  
  // Risk Vector Attribution
  primaryVector: 'SC1' | 'SC2' | 'SC3' | 'SC4' | 'SC5' | 'SC6' | 'SC7';
  secondaryVector?: 'SC1' | 'SC2' | 'SC3' | 'SC4' | 'SC5' | 'SC6' | 'SC7';
  
  // Content
  headline: string;
  summary: string;
  fullText?: string;
  
  // Classification
  signalType: 'threat' | 'action' | 'policy' | 'conflict' | 'economic' | 'diplomatic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  actors: string[]; // Countries, organizations, individuals
  
  // Metadata
  language: string;
  sourceCredibility: number; // 0.0-1.0
  url?: string;
  tags: string[];
  
  // Qualification Status
  isQualified?: boolean;
  qualificationReason?: string;
  qualifiedAt?: Date;
  
  // Corroboration
  corroborationCount?: number;
  corroborationScore?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Corroboration result
 */
export interface CorroborationResult {
  isCorroborated: boolean;
  sourceCount: number;
  combinedCredibility: number;
  firstDetected: Date;
  lastDetected: Date;
  consistencyScore: number; // 0.0-1.0
  conflictingSignals: StructuredSignal[];
}

/**
 * Persistence result
 */
export interface PersistenceResult {
  isPersistent: boolean;
  durationHours: number;
  mentionCount: number;
  averageMentionsPerDay: number;
  lastMention: Date;
  persistenceScore: number; // 0.0-1.0
}

/**
 * Signal qualification result
 */
export interface SignalQualificationResult {
  qualified: boolean;
  reason: string;
  corroboration: CorroborationResult;
  persistence: PersistenceResult;
}

/**
 * Data source configuration
 */
export interface DataSourceConfig {
  sourceId: string;
  sourceName: string;
  sourceType: 'news_wire' | 'event_database' | 'monitor' | 'osint';
  credibilityWeight: number; // 0.0-1.0
  apiEndpoint: string;
  authMethod: 'api_key' | 'oauth' | 'basic';
  updateFrequency: 'realtime' | 'hourly' | 'daily';
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
  isActive: boolean;
}

/**
 * Data source health status
 */
export interface DataSourceHealth {
  sourceId: string;
  isHealthy: boolean;
  latency: number;
  lastSuccessfulFetch: Date;
  errorCount: number;
  rateLimitStatus: {
    remaining: number;
    limit: number;
    resetAt: Date;
  };
}

/**
 * Risk vector definitions
 */
export const RISK_VECTORS = {
  SC1: 'Sanctions & Trade Restrictions',
  SC2: 'Capital Controls & FX Restrictions',
  SC3: 'Nationalization & Expropriation',
  SC4: 'Conflict & Security',
  SC5: 'Political Instability',
  SC6: 'Regulatory & Legal',
  SC7: 'Cyber & Technology'
} as const;

/**
 * Source credibility weights
 */
export const SOURCE_CREDIBILITY: Record<string, number> = {
  'reuters': 0.95,
  'bloomberg': 0.95,
  'ap': 0.95,
  'ft': 0.90,
  'gdelt': 0.85,
  'acled': 0.85,
  'wsj': 0.85,
  'economist': 0.85,
  'local_news': 0.75,
  'regional_news': 0.75,
  'social_media': 0.60,
  'blogs': 0.60,
  'unverified': 0.60
};