/**
 * V.4 Compliant Type Definitions for CO-GRI Step 1 Logic
 * 
 * These types implement the V.4 pseudocode data structures exactly.
 * PRIORITY 1 FIX: Added period/year tracking and raw unit preservation
 * PRIORITY 2 FIX: Separated raw weights from normalized percentages in traces
 */

// ============================================================================
// Period class — lightweight wrapper used by tests and structured items
// ============================================================================
export class Period {
  private readonly _value: string;

  constructor(value: string) {
    this._value = String(value).trim();
  }

  static fromString(value: string | number): Period {
    return new Period(String(value).trim());
  }

  toString(): string {
    return this._value;
  }

  toYear(): number {
    // Extract 4-digit year from strings like "2025", "FY2025", "2024-Q4"
    const match = this._value.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : NaN;
  }

  isAfter(other: Period): boolean {
    return this.toYear() > other.toYear();
  }
}

// Core Enums
export enum Channel {
  REVENUE = 'REVENUE',
  SUPPLY = 'SUPPLY',
  ASSETS = 'ASSETS',
  FINANCIAL = 'FINANCIAL'
}

export enum EvidenceKind {
  STRUCTURED_PRIMARY = 'STRUCTURED_PRIMARY',
  NARRATIVE_PRIMARY = 'NARRATIVE_PRIMARY',
  SUPPLEMENTARY = 'SUPPLEMENTARY'
}

export enum EntityKind {
  COUNTRY = 'COUNTRY',
  GEO_LABEL = 'GEO_LABEL',
  NONSTANDARD_LABEL = 'NONSTANDARD_LABEL',
  CURRENCY_LABEL = 'CURRENCY_LABEL',
  UNKNOWN = 'UNKNOWN'
}

export enum FallbackType {
  DIRECT = 'DIRECT',
  SSF = 'SSF',
  RF_A = 'RF_A',
  RF_B = 'RF_B',
  RF_C = 'RF_C',
  RF_D = 'RF_D',
  GF = 'GF',
  NONE = 'NONE'
}

// Structured Evidence
// PRIORITY 1 FIX: Added period, year, and rawUnit fields
// COMPAT FIX: Added optional entityName/rawText/periodObj aliases used by tests
export interface StructuredItem {
  rawLabel?: string;             // e.g., "United States", "Greater China", "Other countries"
  canonicalLabel?: string;       // canonicalized label
  // Test-friendly aliases (optional — preferred when rawLabel/canonicalLabel absent)
  entityName?: string;           // alias for rawLabel / canonicalLabel
  rawText?: string;              // alias for sourceRef
  entityKind: EntityKind;
  value: number;                 // numeric value, in either % or absolute
  unit?: 'pct' | 'abs' | string; // "pct", "abs", or raw unit string like "millions USD"
  sourceRef?: string;            // table id / section reference
  isTotalRow: boolean;
  period?: string | Period;      // PRIORITY 1 FIX: string "2025" or Period object
  year?: number;                 // PRIORITY 1 FIX: e.g., 2025, 2024
  rawUnit?: string;              // PRIORITY 1 FIX: Original unit before conversion (e.g., "millions USD", "billions USD")
}

/** Resolve the canonical label from a StructuredItem, preferring entityName over rawLabel */
export function resolveItemLabel(item: StructuredItem): string {
  return item.canonicalLabel ?? item.entityName ?? item.rawLabel ?? '';
}

/** Resolve the source ref from a StructuredItem, preferring sourceRef over rawText */
export function resolveItemSourceRef(item: StructuredItem): string {
  return item.sourceRef ?? item.rawText ?? 'structured data';
}

/** Resolve the period string from a StructuredItem */
export function resolveItemPeriod(item: StructuredItem): string {
  if (!item.period) return '';
  if (typeof item.period === 'string') return item.period;
  return item.period.toString();
}

// Narrative Evidence
export interface NarrativeDefinition {
  label: string;                 // e.g., "Greater China", "Europe"
  includes: string[];            // countries explicitly included (canonical)
  excludes: string[];            // countries explicitly excluded
  residualOf: string | null;     // e.g., "Rest of APAC = Asia Pacific excluding Japan and Greater China"
  confidence: number;            // 0..1
  sourceRef: string;
}

export interface NarrativeMentions {
  namedCountries: Set<string>;      // country membership hints
  geoLabels: Set<string>;           // standard bounded labels
  nonStandardLabels: Set<string>;   // "International", "Other", "Overseas", etc.
  currencyLabels: Set<string>;      // if extracted (financial membership hint)
  definitions: Map<string, NarrativeDefinition>; // label -> definition
  rawSentences: string[];           // trace
}

// Simplified narrative shape used by tests and lightweight callers
export interface SimpleNarrative {
  raw: string;
  definitions: Map<string, string | NarrativeDefinition>;
}

// Evidence Bundle (per channel)
export interface EvidenceBundle {
  channel: Channel;
  structuredItems: StructuredItem[];                        // from primary filing only
  narrative: NarrativeMentions | SimpleNarrative;           // full or simplified narrative
  supplementaryMembershipHints?: NarrativeMentions;         // membership hints only (optional)
  homeCountry?: string;
  sector: string;
}

// ============================================================================
// DecisionTrace — internal trace object used by v4Orchestrator
// ============================================================================
export interface DecisionTrace {
  channel: Channel;
  stepLog: string[];
  directAlloc: Map<string, number>;
  labelAllocations: LabelAllocation[];
  fallbackUsed: string;
  unitMode?: 'pct' | 'abs' | 'mixed';
  preNormalizeSum?: number;
  postNormalizeSum?: number;
  finalWeights?: Map<string, number>;
  detectedStructured?: StructuredItem[];
  detectedNarrative?: NarrativeMentions | SimpleNarrative;
}

// Label Allocation Details
// PRIORITY 1 FIX: Added rawUnit tracking
// PRIORITY 2 FIX: Clarified field semantics
export interface LabelAllocation {
  label: string;
  labelTotal: number;              // PRIORITY 2: Raw magnitude in native units (NOT percentage)
  labelUnit: string;               // PRIORITY 2: 'raw' (native units) or 'normalized' (0-1)
  fallbackUsed: FallbackType;
  membershipSet: Set<string>;
  restrictedSetP: Set<string>;
  exclusionsApplied: Set<string>;
  outputCountries: Map<string, number>;  // PRIORITY 2: Raw weights (pre-normalization)
  reason: string;
  rawUnit?: string;                // PRIORITY 1 FIX: Original unit (e.g., "millions USD")
}

// Trace Object (for debugging and transparency)
// PRIORITY 2 FIX: Added pre/post normalize sums for clarity
export interface TraceObject {
  channel: Channel;
  detectedStructured: StructuredItem[];
  detectedNarrative: NarrativeMentions;
  stepLog: string[];
  directAlloc: Map<string, number>;        // PRIORITY 2: Raw weights (pre-normalization)
  labelAllocations: LabelAllocation[];
  finalWeights: Map<string, number>;       // PRIORITY 2: Normalized weights (sum = 1.0)
  unitMode?: 'pct' | 'abs' | 'mixed';     // PRIORITY 1 FIX: Track unit mode through pipeline
  preNormalizeSum?: number;                // PRIORITY 2 FIX: Sum of raw weights before normalization
  postNormalizeSum?: number;               // PRIORITY 2 FIX: Sum after normalization (should be 1.0)
}

// Allocation Result
export interface AllocationResult {
  weights: Map<string, number>;  // country -> weight (sums to 1.0)
  allocation?: Map<string, number>; // alias for weights (test-friendly)
  trace: TraceObject;
}

// Database Enhancement Types (additive only)
export interface V4Metadata {
  version: string;                // "4.0"
  lastEnhanced: string;          // ISO timestamp
  enhancementStatus: 'complete' | 'partial' | 'pending';
  filingPeriod?: string;         // PHASE 3: Filing period (e.g., "2024-Q3" or "2024")
  filingDate?: string;           // PHASE 3: Filing date (ISO string)
}

export interface LabelDefinition {
  membership: string[];          // Countries in this label
  membershipSource: string;      // Source reference
  confidence: number;            // 0-1
}

export interface PPEData {
  items: Array<{
    country?: string;
    label?: string;
    value: number;
    unit: 'pct' | 'abs';
    source: string;
    period?: string;             // PRIORITY 1 FIX: Track period for each item
    year?: number;               // PRIORITY 1 FIX: Track year for each item
  }>;
  total: number;
  source: string;
}

// Enhanced Company Exposure (backward compatible)
export interface EnhancedCompanyExposure {
  // ===== EXISTING FIELDS (100% PRESERVED) =====
  ticker: string;
  companyName: string;
  homeCountry: string;
  sector: string;
  exposures: Array<{
    country: string;
    percentage: number;
    description?: string;
  }>;
  dataSource: string;
  lastUpdated: string;
  
  // ===== NEW V.4 FIELDS (OPTIONAL - ADDITIVE ONLY) =====
  v4Metadata?: V4Metadata;
  labelDefinitions?: Record<string, LabelDefinition>;
  narrativeText?: {
    revenue?: string;
    supply?: string;
    assets?: string;
    financial?: string;
  };
  ppeData?: PPEData;
  channelEvidence?: {
    revenue?: EvidenceBundle;
    supply?: EvidenceBundle;
    assets?: EvidenceBundle;
    financial?: EvidenceBundle;
  };
}

// Membership Resolution Result
export interface MembershipResolution {
  resolvable: boolean;
  members: Set<string>;
  reason: string;
}

// Label Allocation Decision
export interface LabelAllocationDecision {
  method: FallbackType;
  members: Set<string>;
  reason: string;
}

// Restricted Set Build Result
export interface RestrictedSetResult {
  P: Set<string>;
  log: string;
}

// Validation Result
export interface ValidationResult {
  valid: boolean;
  total: number;
  message: string;
}