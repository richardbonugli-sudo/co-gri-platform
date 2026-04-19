/**
 * Decision Trace Service
 * 
 * Captures Step-1 decision logic with detailed allocation traces
 */

import {
  Step1DecisionTrace,
  ClosedLabelTrace,
  MembershipResolution,
  DirectCountryLock,
  RFCaseTrace,
  CountryAllocation
} from './types/debugBundle.types';

/**
 * Create Step-1 decision trace for closed label case
 */
export function createClosedLabelTrace(
  unitMode: 'pct' | 'abs' | 'mixed',
  totalRowValue: number | null,
  closedLabels: ClosedLabelInfo[],
  directCountries: DirectCountryLock[]
): Step1DecisionTrace {
  
  return {
    unitMode,
    totalRowValue,
    closedLabels: closedLabels.map(label => createClosedLabelTraceItem(label)),
    directCountriesLocked: directCountries
  };
}

/**
 * Create Step-1 decision trace for RF case
 */
export function createRFCaseTrace(
  unitMode: 'pct' | 'abs' | 'mixed',
  rfCase: 'RF_B' | 'RF_C' | 'RF_D',
  restrictedSetP: Set<string>,
  rfAllocation: Map<string, number>
): Step1DecisionTrace {
  
  const restrictedSetArray = Array.from(restrictedSetP);
  
  return {
    unitMode,
    totalRowValue: null,
    rfCase: {
      rfCaseChosen: rfCase,
      restrictedSetP_size: restrictedSetArray.length,
      restrictedSetP_preview: restrictedSetArray.slice(0, 30),
      rfAllocationTop10: mapToTop10Allocations(rfAllocation)
    }
  };
}

/**
 * Create closed label trace item
 */
function createClosedLabelTraceItem(
  labelInfo: ClosedLabelInfo
): ClosedLabelTrace {
  
  return {
    label: labelInfo.label,
    labelTotalWeight: labelInfo.totalWeight,
    membershipResolution: {
      resolvable: labelInfo.membershipResolvable,
      members: Array.from(labelInfo.members),
      resolution_source: labelInfo.resolutionSource
    },
    fallbackChosen: labelInfo.fallbackUsed,
    allocationOutputTop10: mapToTop10Allocations(labelInfo.allocation),
    exclusionsApplied: Array.from(labelInfo.exclusions)
  };
}

/**
 * Convert allocation map to top 10 country allocations
 */
function mapToTop10Allocations(
  allocation: Map<string, number>
): CountryAllocation[] {
  
  const allocations: CountryAllocation[] = [];
  
  for (const [country, weight] of allocation.entries()) {
    allocations.push({
      country,
      weight,
      percentage: weight * 100
    });
  }
  
  // Sort by weight descending
  allocations.sort((a, b) => b.weight - a.weight);
  
  // Return top 10
  return allocations.slice(0, 10);
}

/**
 * Trace SSF allocation decision
 */
export function traceSSFAllocation(
  label: string,
  members: Set<string>,
  totalWeight: number,
  allocation: Map<string, number>,
  sector: string
): {
  mechanism: 'SSF';
  label: string;
  members: string[];
  totalWeight: number;
  allocation: CountryAllocation[];
  sector: string;
} {
  return {
    mechanism: 'SSF',
    label,
    members: Array.from(members),
    totalWeight,
    allocation: mapToTop10Allocations(allocation),
    sector
  };
}

/**
 * Trace RF_A allocation decision
 */
export function traceRFAAllocation(
  label: string,
  members: Set<string>,
  totalWeight: number,
  allocation: Map<string, number>,
  reason: string
): {
  mechanism: 'RF_A';
  label: string;
  members: string[];
  totalWeight: number;
  allocation: CountryAllocation[];
  reason: string;
} {
  return {
    mechanism: 'RF_A',
    label,
    members: Array.from(members),
    totalWeight,
    allocation: mapToTop10Allocations(allocation),
    reason
  };
}

/**
 * Trace RF_B/C/D allocation decision
 */
export function traceRFAllocation(
  rfCase: 'RF_B' | 'RF_C' | 'RF_D',
  restrictedSet: Set<string>,
  totalWeight: number,
  allocation: Map<string, number>,
  reason: string
): {
  mechanism: 'RF_B' | 'RF_C' | 'RF_D';
  restrictedSetSize: number;
  restrictedSetPreview: string[];
  totalWeight: number;
  allocation: CountryAllocation[];
  reason: string;
} {
  const restrictedArray = Array.from(restrictedSet);
  
  return {
    mechanism: rfCase,
    restrictedSetSize: restrictedArray.length,
    restrictedSetPreview: restrictedArray.slice(0, 30),
    totalWeight,
    allocation: mapToTop10Allocations(allocation),
    reason
  };
}

/**
 * Analyze allocation branching
 */
export function analyzeAllocationBranching(
  trace: Step1DecisionTrace
): {
  hasClosedLabels: boolean;
  closedLabelCount: number;
  directCountryCount: number;
  usesSSF: boolean;
  usesRFA: boolean;
  usesRFB: boolean;
  usesRFC: boolean;
  usesRFD: boolean;
  branchingSummary: string;
} {
  
  const hasClosedLabels = !!trace.closedLabels && trace.closedLabels.length > 0;
  const closedLabelCount = trace.closedLabels?.length || 0;
  const directCountryCount = trace.directCountriesLocked?.length || 0;
  
  let usesSSF = false;
  let usesRFA = false;
  
  if (trace.closedLabels) {
    for (const label of trace.closedLabels) {
      if (label.fallbackChosen === 'SSF') usesSSF = true;
      if (label.fallbackChosen === 'RF_A') usesRFA = true;
    }
  }
  
  const usesRFB = trace.rfCase?.rfCaseChosen === 'RF_B';
  const usesRFC = trace.rfCase?.rfCaseChosen === 'RF_C';
  const usesRFD = trace.rfCase?.rfCaseChosen === 'RF_D';
  
  // Generate branching summary
  let branchingSummary: string;
  
  if (hasClosedLabels) {
    branchingSummary = `Closed label case with ${closedLabelCount} labels and ${directCountryCount} direct countries. `;
    if (usesSSF) branchingSummary += 'SSF applied to resolvable labels. ';
    if (usesRFA) branchingSummary += 'RF_A applied to unresolvable labels. ';
  } else if (trace.rfCase) {
    branchingSummary = `No closed totals. ${trace.rfCase.rfCaseChosen} applied to restricted set of ${trace.rfCase.restrictedSetP_size} countries.`;
  } else {
    branchingSummary = 'No allocation performed (insufficient evidence).';
  }
  
  return {
    hasClosedLabels,
    closedLabelCount,
    directCountryCount,
    usesSSF,
    usesRFA,
    usesRFB,
    usesRFC,
    usesRFD,
    branchingSummary
  };
}

// ============================================================================
// Helper Types
// ============================================================================

export interface ClosedLabelInfo {
  label: string;
  totalWeight: number;
  members: Set<string>;
  membershipResolvable: boolean;
  resolutionSource: 'narrative_definition' | 'UN_M49' | 'not_resolvable';
  fallbackUsed: 'SSF' | 'RF_A' | 'none';
  allocation: Map<string, number>;
  exclusions: Set<string>;
}