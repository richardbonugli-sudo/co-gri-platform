/**
 * CSI Engine Core Type Definitions
 * Based on Appendix B specifications
 */

// ============================================================================
// CORE ENUMS
// ============================================================================

export enum RiskVector {
  POLITICAL = 'political',
  ECONOMIC = 'economic',
  SECURITY = 'security',
  SOCIAL = 'social',
  ENVIRONMENTAL = 'environmental',
  TECHNOLOGICAL = 'technological'
}

export enum SourceTier {
  TIER_1_AUTHORITATIVE = 'tier_1_authoritative',
  TIER_2_REPUTABLE = 'tier_2_reputable',
  TIER_3_SUPPLEMENTARY = 'tier_3_supplementary'
}

export enum EscalationLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MODERATE = 'moderate',
  LOW = 'low'
}

export enum EventStatus {
  CANDIDATE = 'candidate',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// ============================================================================
// ESCALATION SIGNAL LOG
// ============================================================================

export interface EscalationSignal {
  signalId: string;
  timestamp: Date;
  sourceId: string;
  sourceTier: SourceTier;
  country: string;
  vector: RiskVector;
  escalationLevel: EscalationLevel;
  rawContent: string;
  confidence: number;
  metadata: {
    headline?: string;
    url?: string;
    author?: string;
    publicationDate?: Date;
  };
}

// ============================================================================
// EVENT CANDIDATE STORE
// ============================================================================

export interface EventCandidate {
  candidateId: string;
  country: string;
  vector: RiskVector;
  escalationLevel: EscalationLevel;
  supportingSignals: EscalationSignal[];
  firstDetected: Date;
  lastUpdated: Date;
  status: EventStatus;
  gatingChecks: {
    tierValidation: boolean;
    crossSourceConfirmation: boolean;
    temporalCoherence: boolean;
    vectorAlignment: boolean;
  };
  validationScore: number;
}

// ============================================================================
// EVENT DELTA LEDGER
// ============================================================================

export interface EventDelta {
  deltaId: string;
  eventId: string;
  timestamp: Date;
  country: string;
  vector: RiskVector;
  deltaType: 'new' | 'escalation' | 'de-escalation' | 'expiration';
  previousLevel?: EscalationLevel;
  newLevel: EscalationLevel;
  triggeringSignals: string[]; // Signal IDs
  csiImpact: {
    vectorDelta: number;
    compositeDelta: number;
  };
  auditTrail: {
    validatedBy: string;
    validationTimestamp: Date;
    overrideApplied: boolean;
    overrideReason?: string;
  };
}

// ============================================================================
// CSI CALCULATION
// ============================================================================

export interface VectorScore {
  vector: RiskVector;
  baselineScore: number;
  currentScore: number;
  activeEvents: string[]; // Event IDs
  lastUpdated: Date;
  trend: 'improving' | 'stable' | 'deteriorating';
}

export interface CSIScore {
  country: string;
  timestamp: Date;
  compositeScore: number;
  vectorScores: Record<RiskVector, VectorScore>;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  dataQuality: {
    coverageScore: number; // 0-1
    recencyScore: number; // 0-1
    sourceReliability: number; // 0-1
  };
}

// ============================================================================
// SOURCE CLASSIFICATION
// ============================================================================

export interface SourceProfile {
  sourceId: string;
  name: string;
  tier: SourceTier;
  primaryVectors: RiskVector[];
  geographicCoverage: string[]; // Country codes
  reliabilityScore: number; // 0-1
  updateFrequency: 'real-time' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastValidated: Date;
  metadata: {
    url?: string;
    apiEndpoint?: string;
    credentialRequired: boolean;
  };
}

// ============================================================================
// GATING LOGIC
// ============================================================================

export interface GatingRule {
  ruleId: string;
  name: string;
  description: string;
  requiredTier: SourceTier;
  minimumSignals: number;
  temporalWindow: number; // hours
  crossSourceRequired: boolean;
  vectorSpecific: boolean;
  enabled: boolean;
}

export interface GatingResult {
  passed: boolean;
  ruleResults: Record<string, boolean>;
  failureReasons: string[];
  confidence: number;
}

// ============================================================================
// DECAY & PERSISTENCE
// ============================================================================

export interface DecayParameters {
  halfLife: number; // days
  minimumPersistence: number; // hours
  criticalPersistence: number; // hours
  decayFunction: 'exponential' | 'linear' | 'step';
}

export interface EventPersistence {
  eventId: string;
  createdAt: Date;
  lastRefreshed: Date;
  expiresAt: Date;
  decayRate: number;
  currentWeight: number; // 0-1
  persistenceExtensions: {
    timestamp: Date;
    reason: string;
    extendedBy: number; // hours
  }[];
}

// ============================================================================
// SPILLOVER LOGIC
// ============================================================================

export interface SpilloverRule {
  sourceCountry: string;
  targetCountries: string[];
  vector: RiskVector;
  spilloverProbability: number; // 0-1
  attenuationFactor: number; // 0-1
  conditions: {
    tradeIntensity?: number;
    geographicProximity?: boolean;
    politicalAlignment?: string;
  };
}

export interface SpilloverEvent {
  spilloverId: string;
  sourceEventId: string;
  sourceCountry: string;
  targetCountry: string;
  vector: RiskVector;
  originalLevel: EscalationLevel;
  attenuatedLevel: EscalationLevel;
  probability: number;
  createdAt: Date;
  validatedAt?: Date;
}

// ============================================================================
// OVERRIDE MANAGEMENT
// ============================================================================

export interface OverrideRequest {
  overrideId: string;
  requestedBy: string;
  requestedAt: Date;
  country: string;
  vector: RiskVector;
  currentScore: number;
  proposedScore: number;
  justification: string;
  supportingEvidence: string[];
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface OverrideAudit {
  auditId: string;
  overrideId: string;
  appliedAt: Date;
  appliedBy: string;
  country: string;
  vector: RiskVector;
  beforeScore: number;
  afterScore: number;
  duration: number; // hours
  autoRevertAt: Date;
  reverted: boolean;
  revertedAt?: Date;
}

// ============================================================================
// HISTORICAL BASELINE
// ============================================================================

export interface HistoricalBaseline {
  country: string;
  vector: RiskVector;
  period: {
    start: Date;
    end: Date;
  };
  baselineScore: number;
  dataPoints: {
    date: Date;
    score: number;
    source: string;
  }[];
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
  };
  lastCalculated: Date;
}

// ============================================================================
// ENGINE STATE
// ============================================================================

export interface CSIEngineState {
  initialized: boolean;
  lastUpdate: Date;
  activeCountries: string[];
  totalSignals: number;
  activeCandidates: number;
  validatedEvents: number;
  systemHealth: {
    dataFreshness: number; // 0-1
    processingLatency: number; // ms
    errorRate: number; // 0-1
  };
}