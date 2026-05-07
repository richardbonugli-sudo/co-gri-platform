/**
 * V.4 Orchestrator with Debug Bundle Generation
 * 
 * Wraps the core V.4 orchestrator with comprehensive debug output
 */

import {
  Channel,
  EvidenceBundle,
  AllocationResult,
  TraceObject
} from '@/types/v4Types';

import { allocateChannel_V4 } from './v4Orchestrator';

import {
  DebugBundle,
  DebugBundleOptions,
  Step1DecisionTrace,
  ClosedLabelTrace
} from './types/debugBundle.types';

import {
  initializeDebugBundle,
  writeDebugBundle,
  validateDebugBundle
} from './debugBundleGenerator';

import { captureStep0Evidence } from './evidenceCapture';

import {
  createClosedLabelTrace,
  createRFCaseTrace,
  ClosedLabelInfo
} from './decisionTrace';

import {
  performIntegrityChecks,
  buildProvenanceMap,
  mergeAllocationsWithProvenance,
  normalizeWeights,
  LabelAllocationResult
} from './integrityChecks';

import {
  createUIMappingAudit,
  RawStep1TraceData
} from './uiMappingAudit';

import {
  createRevenueSpecificDebug,
  RevenueLabelData
} from './revenueSpecificDebug';

/**
 * Allocate channel with debug bundle generation
 */
export async function allocateChannelWithDebug_V4(
  evidenceBundle: EvidenceBundle,
  ticker: string,
  options: DebugBundleOptions
): Promise<{
  result: AllocationResult;
  debugBundle?: DebugBundle;
  debugBundlePath?: string;
}> {
  
  if (!options.enableDebug) {
    // No debug, just run normal allocation
    const result = allocateChannel_V4(evidenceBundle);
    return { result };
  }
  
  // Initialize debug bundle
  const { bundle, runId, metadata } = initializeDebugBundle(
    ticker,
    evidenceBundle.channel,
    options
  );
  
  // Run allocation
  const result = allocateChannel_V4(evidenceBundle);
  
  // Build complete debug bundle
  const completeBundle = await buildCompleteDebugBundle(
    evidenceBundle,
    result,
    ticker,
    metadata,
    options
  );
  
  // Validate completeness
  const validation = validateDebugBundle(completeBundle, evidenceBundle.channel);
  if (!validation.isValid) {
    console.warn('[Debug Bundle] Incomplete bundle:', validation.missingFields);
  }
  
  // Write to file (optional)
  let debugBundlePath: string | undefined;
  if (options.outputPath) {
    debugBundlePath = await writeDebugBundle(
      completeBundle,
      ticker,
      evidenceBundle.channel,
      runId,
      options.outputPath
    );
  }
  
  return { result, debugBundle: completeBundle, debugBundlePath };
}

/**
 * Build complete debug bundle from allocation result
 */
async function buildCompleteDebugBundle(
  evidenceBundle: EvidenceBundle,
  result: AllocationResult,
  ticker: string,
  metadata: any,
  options: DebugBundleOptions
): Promise<DebugBundle> {
  
  // Section 1: Engine metadata (already created)
  const engineMetadata = metadata;
  
  // Section 2: Step-0 Evidence
  const step0Evidence = captureStep0Evidence(evidenceBundle, evidenceBundle.channel);
  
  // Section 3: Step-1 Decision Trace
  const step1DecisionTrace = buildStep1DecisionTrace(result.trace, evidenceBundle);
  
  // Section 4: Integrity Checks
  const integrityChecks = buildIntegrityChecks(result.trace);
  
  // Section 5: UI Mapping Audit
  const uiMappingAudit = buildUIMappingAudit(result.trace);
  
  // Section 6: Revenue-Specific (if Revenue channel)
  let revenueSpecific = undefined;
  if (evidenceBundle.channel === Channel.REVENUE) {
    revenueSpecific = buildRevenueSpecificDebug(result.trace);
  }
  
  return {
    engineMetadata,
    step0Evidence,
    step1DecisionTrace,
    integrityChecks,
    uiMappingAudit,
    revenueSpecific
  };
}

/**
 * Build Step-1 decision trace from trace object
 */
function buildStep1DecisionTrace(
  trace: TraceObject,
  evidenceBundle: EvidenceBundle
): Step1DecisionTrace {
  
  // Determine unit mode
  const unitMode = inferUnitModeFromTrace(trace);
  const totalRowValue = null; // Would be extracted from structured items
  
  // Check if we have closed labels
  const hasClosedLabels = trace.labelAllocations?.some(
    alloc => alloc.fallbackUsed === 'SSF' || alloc.fallbackUsed === 'RF_A'
  ) || false;
  
  if (hasClosedLabels) {
    // Build closed label traces
    const closedLabels: ClosedLabelInfo[] = (trace.labelAllocations || [])
      .filter(alloc => alloc.fallbackUsed === 'SSF' || alloc.fallbackUsed === 'RF_A')
      .map(alloc => ({
        label: alloc.label,
        totalWeight: alloc.labelTotal,
        members: alloc.membershipSet,
        membershipResolvable: alloc.fallbackUsed === 'SSF',
        resolutionSource: alloc.fallbackUsed === 'SSF' 
          ? 'narrative_definition' as const
          : 'not_resolvable' as const,
        fallbackUsed: alloc.fallbackUsed as 'SSF' | 'RF_A',
        allocation: alloc.outputCountries,
        exclusions: alloc.exclusionsApplied
      }));
    
    // Build direct country locks (with null check)
    const directCountries = trace.directAlloc 
      ? Array.from(trace.directAlloc.entries()).map(([country, weight]) => ({
          country,
          rawValue: weight,
          normalizedWeight: weight
        }))
      : [];
    
    return createClosedLabelTrace(unitMode, totalRowValue, closedLabels, directCountries);
  } else {
    // RF case (no closed totals)
    const rfAlloc = trace.labelAllocations?.find(
      alloc => alloc.fallbackUsed === 'RF_B' || alloc.fallbackUsed === 'RF_C' || alloc.fallbackUsed === 'RF_D'
    );
    
    if (rfAlloc) {
      return createRFCaseTrace(
        unitMode,
        rfAlloc.fallbackUsed as 'RF_B' | 'RF_C' | 'RF_D',
        rfAlloc.restrictedSetP,
        rfAlloc.outputCountries
      );
    }
  }
  
  // Default empty trace
  return {
    unitMode,
    totalRowValue,
    closedLabels: [],
    directCountriesLocked: []
  };
}

/**
 * Build integrity checks from trace
 * 
 * ROOT CAUSE FIX: Calculate preNormalizeSum and postNormalizeSum locally,
 * then override the values returned by performIntegrityChecks()
 * CRITICAL FIX: Added null/undefined checks for trace.directAlloc
 */
function buildIntegrityChecks(trace: TraceObject) {
  
  // Calculate pre-normalize sum (sum of all allocations before normalization)
  let preNormalizeSum = 0;
  
  // CRITICAL FIX: Check if directAlloc exists before accessing .values()
  if (trace.directAlloc) {
    for (const weight of trace.directAlloc.values()) {
      preNormalizeSum += weight;
    }
  }
  
  // CRITICAL FIX: Check if labelAllocations exists
  if (trace.labelAllocations) {
    for (const alloc of trace.labelAllocations) {
      if (alloc.outputCountries) {
        for (const weight of alloc.outputCountries.values()) {
          preNormalizeSum += weight;
        }
      }
    }
  }
  
  // Post-normalize sum (should be 1.0)
  // CRITICAL FIX: Check if finalWeights exists
  const postNormalizeSum = trace.finalWeights 
    ? Array.from(trace.finalWeights.values()).reduce((sum, w) => sum + w, 0)
    : 0;
  
  // Build provenance map
  const labelAllocationResults: LabelAllocationResult[] = (trace.labelAllocations || []).map(alloc => ({
    label: alloc.label,
    mechanism: alloc.fallbackUsed as any,
    allocation: alloc.outputCountries
  }));
  
  // CRITICAL FIX: Initialize empty map if directAlloc is undefined
  const directAlloc = trace.directAlloc || new Map<string, number>();
  const finalWeights = trace.finalWeights || new Map<string, number>();
  
  const provenanceMap = buildProvenanceMap(directAlloc, labelAllocationResults);
  
  // Call performIntegrityChecks for provenance/double-counting logic
  const integrityChecks = performIntegrityChecks(
    directAlloc,
    finalWeights,
    provenanceMap
  );
  
  // Override with correctly calculated sums from complete data
  return {
    ...integrityChecks,
    preNormalizeSum,
    postNormalizeSum
  };
}

/**
 * Build UI mapping audit from trace
 */
function buildUIMappingAudit(trace: TraceObject) {
  
  const rawTraceData: RawStep1TraceData = {
    directAllocations: trace.directAlloc || new Map<string, number>(),
    labelAllocations: (trace.labelAllocations || []).map(alloc => ({
      label: alloc.label,
      mechanism: alloc.fallbackUsed,
      members: alloc.membershipSet,
      exclusions: alloc.exclusionsApplied,
      allocation: alloc.outputCountries
    })),
    finalWeights: trace.finalWeights || new Map<string, number>(),
    stepLog: trace.stepLog || []
  };
  
  // Build UI payload (simplified - would come from actual UI formatter)
  const finalWeights = trace.finalWeights || new Map<string, number>();
  const labelAllocations = trace.labelAllocations || [];
  
  const uiPayload = {
    channelBreakdown: Object.fromEntries(finalWeights.entries()),
    displayLabels: labelAllocations.map(alloc => alloc.label),
    fallbackSummary: labelAllocations.length > 0 
      ? labelAllocations[0].fallbackUsed 
      : 'none'
  };
  
  return createUIMappingAudit(rawTraceData, uiPayload);
}

/**
 * Build revenue-specific debug from trace
 */
function buildRevenueSpecificDebug(trace: TraceObject) {
  
  const revenueLabelData: RevenueLabelData[] = (trace.labelAllocations || []).map(alloc => ({
    label: alloc.label,
    members: alloc.membershipSet,
    exclusions: alloc.exclusionsApplied,
    fallbackUsed: (alloc.fallbackUsed === 'SSF' || alloc.fallbackUsed === 'RF_A') 
      ? alloc.fallbackUsed 
      : 'none' as const,
    allocation: alloc.outputCountries
  }));
  
  return createRevenueSpecificDebug(revenueLabelData, trace.finalWeights || new Map<string, number>());
}

/**
 * Infer unit mode from trace
 */
function inferUnitModeFromTrace(trace: TraceObject): 'pct' | 'abs' | 'mixed' {
  // Simplified - would analyze structured items
  return 'pct';
}

/**
 * Run Step 1 for all channels with debug output
 */
export async function runStep1WithDebug_V4(
  evidenceBundles: Map<Channel, EvidenceBundle>,
  ticker: string,
  options: DebugBundleOptions
): Promise<{
  results: Map<Channel, AllocationResult>;
  debugBundles: Map<Channel, DebugBundle>;
  debugBundlePaths: string[];
}> {
  
  const results = new Map<Channel, AllocationResult>();
  const debugBundles = new Map<Channel, DebugBundle>();
  const debugBundlePaths: string[] = [];
  
  console.log(`[runStep1WithDebug_V4] Processing ${evidenceBundles.size} channels for ${ticker}`);
  
  for (const [channel, evidence] of evidenceBundles.entries()) {
    console.log(`[runStep1WithDebug_V4] Processing channel: ${channel}`);
    
    try {
      const { result, debugBundle, debugBundlePath } = await allocateChannelWithDebug_V4(
        evidence,
        ticker,
        options
      );
      
      results.set(channel, result);
      
      if (debugBundle) {
        debugBundles.set(channel, debugBundle);
        console.log(`[runStep1WithDebug_V4] ✅ Debug bundle created for ${channel}`);
      } else {
        console.warn(`[runStep1WithDebug_V4] ⚠️ No debug bundle for ${channel}`);
      }
      
      if (debugBundlePath) {
        debugBundlePaths.push(debugBundlePath);
      }
    } catch (error) {
      console.error(`[runStep1WithDebug_V4] ❌ Error processing ${channel}:`, error);
      throw new Error(`Failed to process channel ${channel}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
  }
  
  console.log(`[runStep1WithDebug_V4] Completed. Debug bundles: ${debugBundles.size}/${evidenceBundles.size}`);
  
  return { results, debugBundles, debugBundlePaths };
}