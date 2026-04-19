/**
 * Debug Bundle Type Definitions
 * 
 * Comprehensive type system for V.4 COGRI debug output
 */

export interface DebugBundle {
  // Section 1: Engine + Cache Proof
  engineMetadata: EngineMetadata;
  
  // Section 2: Step-0 Evidence Bundle
  step0Evidence: Step0Evidence;
  
  // Section 3: Step-1 Decision Trace
  step1DecisionTrace: Step1DecisionTrace;
  
  // Section 4: Merge + Double-Counting Checks
  integrityChecks: IntegrityChecks;
  
  // Section 5: UI Mapping Audit
  uiMappingAudit: UIMappingAudit;
  
  // Section 6: Revenue-Specific Requirements (for Revenue channel only)
  revenueSpecific?: RevenueSpecificDebug;
}

// ============================================================================
// Section 1: Engine + Cache Proof
// ============================================================================

export interface EngineMetadata {
  engine_version: string;           // e.g., "2026-01-01_abc123def"
  run_id: string;                   // Unique run identifier
  cache_hit: boolean;               // Was this a cached result?
  cache_key: string;                // Cache key used
  inputs_hash: string;              // Hash of SEC filing + config
  config_snapshot: ConfigSnapshot;  // Key Step-1 flags/overrides
  timestamp: string;                // ISO timestamp
  ticker: string;
  channel: string;
}

export interface ConfigSnapshot {
  channel: string;
  useV4Orchestrator: boolean;
  channelSpecificRouting?: Record<string, any>;
  featureFlags?: Record<string, any>;
}

// ============================================================================
// Section 2: Step-0 Evidence Bundle
// ============================================================================

export interface Step0Evidence {
  channel: string;
  
  // A) Structured Evidence
  structuredEvidence: StructuredEvidence;
  
  // B) Narrative Extraction
  narrativeExtraction: NarrativeExtraction;
  
  // C) Supplementary Membership Hints
  supplementaryHints: SupplementaryHints;
}

export interface StructuredEvidence {
  detected_tables: DetectedTable[];
  structuredItems: StructuredItemDebug[];
}

export interface DetectedTable {
  table_id: string;
  section_name: string;
  header_text: string;
  page_anchor?: number;
  line_anchor?: number;
  row_count: number;
}

export interface StructuredItemDebug {
  rawLabel: string;
  canonicalLabel: string;
  entityKind: 'COUNTRY' | 'GEO_LABEL' | 'NONSTANDARD';
  value: number;
  unit: 'pct' | 'abs';
  isTotalRow: boolean;
  sourceRef: string;
}

export interface NarrativeExtraction {
  namedCountries: string[];
  geoLabels: string[];
  nonStandardLabels: string[];
  definitions: NarrativeDefinitionDebug[];
}

export interface NarrativeDefinitionDebug {
  label: string;
  includes: string[];
  excludes: string[];
  residualOf: string | null;
  confidence: number;
  sourceRef: string;
}

export interface SupplementaryHints {
  namedCountries: string[];
  geoLabels: string[];
  nonStandardLabels: string[];
  source: string;
}

// ============================================================================
// Section 3: Step-1 Decision Trace
// ============================================================================

export interface Step1DecisionTrace {
  unitMode: 'pct' | 'abs' | 'mixed';
  totalRowValue: number | null;
  
  // For closed label case
  closedLabels?: ClosedLabelTrace[];
  directCountriesLocked?: DirectCountryLock[];
  
  // For RF case (no closed totals)
  rfCase?: RFCaseTrace;
}

export interface ClosedLabelTrace {
  label: string;
  labelTotalWeight: number;
  membershipResolution: MembershipResolution;
  fallbackChosen: 'SSF' | 'RF_A' | 'none';
  allocationOutputTop10: CountryAllocation[];
  exclusionsApplied: string[];
}

export interface MembershipResolution {
  resolvable: boolean;
  members: string[];
  resolution_source: 'narrative_definition' | 'UN_M49' | 'not_resolvable';
}

export interface DirectCountryLock {
  country: string;
  rawValue: number;
  normalizedWeight: number;
}

export interface RFCaseTrace {
  rfCaseChosen: 'RF_B' | 'RF_C' | 'RF_D';
  restrictedSetP_size: number;
  restrictedSetP_preview: string[];  // Top ~30 countries
  rfAllocationTop10: CountryAllocation[];
}

export interface CountryAllocation {
  country: string;
  weight: number;
  percentage: number;  // weight * 100
}

// ============================================================================
// Section 4: Merge + Double-Counting Checks
// ============================================================================

export interface IntegrityChecks {
  preNormalizeSum: number;
  postNormalizeSum: number;
  countryContributionsBySource: CountryProvenance[];
  doubleCountingDetected: boolean;
  doubleCountingDetails?: DoubleCountingDetail[];
}

export interface CountryProvenance {
  country: string;
  totalWeight: number;
  sources: SourceContribution[];
}

export interface SourceContribution {
  label: string;
  weight: number;
  mechanism: 'direct' | 'SSF' | 'RF_A' | 'RF_B' | 'RF_C' | 'RF_D' | 'GF';
}

export interface DoubleCountingDetail {
  country: string;
  overlappingLabels: string[];
  totalOverlap: number;
}

// ============================================================================
// Section 5: UI Mapping Audit
// ============================================================================

export interface UIMappingAudit {
  rawStep1InternalTrace: RawStep1Trace;
  formattedUIPayload: FormattedUIPayload;
  mismatches: UIMismatch[];
}

export interface RawStep1Trace {
  directAlloc: Record<string, number>;
  labelAllocations: LabelAllocationTrace[];
  finalWeights: Record<string, number>;
  stepLog: string[];
}

export interface LabelAllocationTrace {
  label: string;
  mechanism: string;
  members: string[];
  exclusions: string[];
  outputWeights: Record<string, number>;
}

export interface FormattedUIPayload {
  channelBreakdown: Record<string, any>;
  displayLabels: string[];
  fallbackSummary: string;
}

export interface UIMismatch {
  type: 'label_mismatch' | 'fallback_mismatch' | 'weight_mismatch';
  description: string;
  expected: any;
  actual: any;
}

// ============================================================================
// Section 6: Revenue-Specific Requirements
// ============================================================================

export interface RevenueSpecificDebug {
  labelAllocations: RevenueLabelAllocation[];
  perCountryProvenance: RevenueCountryProvenance[];
}

export interface RevenueLabelAllocation {
  segmentLabel: string;  // e.g., "Americas", "Greater China"
  membershipSet: string[];
  exclusions: string[];
  fallbackUsed: 'SSF' | 'RF_A' | 'none';
  outputWeights: Record<string, number>;
}

export interface RevenueCountryProvenance {
  country: string;
  contributingLabels: string[];
  totalWeight: number;
  breakdown: Record<string, number>;  // label -> weight
}

// ============================================================================
// Helper Types
// ============================================================================

export interface DebugBundleOptions {
  enableDebug: boolean;
  run_id?: string;
  cache_bust?: boolean;
  outputPath?: string;
}