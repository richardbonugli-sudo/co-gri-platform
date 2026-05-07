/**
 * UI Mapping Audit Service
 * 
 * Compares raw Step-1 internal trace with formatted UI payload
 * to detect mismatches between computation and display
 */

import {
  UIMappingAudit,
  RawStep1Trace,
  LabelAllocationTrace,
  FormattedUIPayload,
  UIMismatch
} from './types/debugBundle.types';

/**
 * Create UI mapping audit
 */
export function createUIMappingAudit(
  rawTrace: RawStep1TraceData,
  uiPayload: any
): UIMappingAudit {
  
  const rawStep1InternalTrace = formatRawTrace(rawTrace);
  const formattedUIPayload = formatUIPayload(uiPayload);
  const mismatches = detectMismatches(rawStep1InternalTrace, formattedUIPayload);
  
  return {
    rawStep1InternalTrace,
    formattedUIPayload,
    mismatches
  };
}

/**
 * Format raw trace data
 */
function formatRawTrace(rawTrace: RawStep1TraceData): RawStep1Trace {
  
  const directAlloc: Record<string, number> = {};
  for (const [country, weight] of rawTrace.directAllocations.entries()) {
    directAlloc[country] = weight;
  }
  
  const labelAllocations: LabelAllocationTrace[] = rawTrace.labelAllocations.map(label => ({
    label: label.label,
    mechanism: label.mechanism,
    members: Array.from(label.members),
    exclusions: Array.from(label.exclusions),
    outputWeights: Object.fromEntries(label.allocation.entries())
  }));
  
  const finalWeights: Record<string, number> = {};
  for (const [country, weight] of rawTrace.finalWeights.entries()) {
    finalWeights[country] = weight;
  }
  
  return {
    directAlloc,
    labelAllocations,
    finalWeights,
    stepLog: rawTrace.stepLog
  };
}

/**
 * Format UI payload
 */
function formatUIPayload(uiPayload: any): FormattedUIPayload {
  
  return {
    channelBreakdown: uiPayload.channelBreakdown || {},
    displayLabels: uiPayload.displayLabels || [],
    fallbackSummary: uiPayload.fallbackSummary || 'none'
  };
}

/**
 * Detect mismatches between raw trace and UI payload
 */
function detectMismatches(
  rawTrace: RawStep1Trace,
  uiPayload: FormattedUIPayload
): UIMismatch[] {
  
  const mismatches: UIMismatch[] = [];
  
  // Check for label mismatches
  const rawLabels = new Set(rawTrace.labelAllocations.map(l => l.label));
  const uiLabels = new Set(uiPayload.displayLabels);
  
  for (const rawLabel of rawLabels) {
    if (!uiLabels.has(rawLabel)) {
      mismatches.push({
        type: 'label_mismatch',
        description: `Label "${rawLabel}" present in computation but missing from UI display`,
        expected: rawLabel,
        actual: null
      });
    }
  }
  
  for (const uiLabel of uiLabels) {
    if (!rawLabels.has(uiLabel)) {
      mismatches.push({
        type: 'label_mismatch',
        description: `Label "${uiLabel}" shown in UI but not present in computation`,
        expected: null,
        actual: uiLabel
      });
    }
  }
  
  // Check for fallback mismatches
  const rawMechanisms = new Set(rawTrace.labelAllocations.map(l => l.mechanism));
  const hasFallback = rawMechanisms.has('SSF') || rawMechanisms.has('RF_A') || 
                      rawMechanisms.has('RF_B') || rawMechanisms.has('RF_C') || 
                      rawMechanisms.has('RF_D');
  
  if (hasFallback && uiPayload.fallbackSummary === 'none') {
    mismatches.push({
      type: 'fallback_mismatch',
      description: 'Fallback mechanisms used in computation but UI shows "fallback: none"',
      expected: Array.from(rawMechanisms).join(', '),
      actual: 'none'
    });
  }
  
  // Check for weight mismatches
  for (const [country, rawWeight] of Object.entries(rawTrace.finalWeights)) {
    const uiWeight = uiPayload.channelBreakdown[country]?.weight;
    
    if (uiWeight !== undefined) {
      const diff = Math.abs(rawWeight - uiWeight);
      if (diff > 0.0001) {  // Tolerance for floating point
        mismatches.push({
          type: 'weight_mismatch',
          description: `Weight mismatch for ${country}: computation=${rawWeight.toFixed(4)}, UI=${uiWeight.toFixed(4)}`,
          expected: rawWeight,
          actual: uiWeight
        });
      }
    }
  }
  
  return mismatches;
}

/**
 * Generate UI mapping report
 */
export function generateUIMappingReport(audit: UIMappingAudit): string {
  
  const lines: string[] = [];
  
  lines.push('=== UI MAPPING AUDIT REPORT ===');
  lines.push('');
  
  lines.push('Raw Computation:');
  lines.push(`  Direct Allocations: ${Object.keys(audit.rawStep1InternalTrace.directAlloc).length} countries`);
  lines.push(`  Label Allocations: ${audit.rawStep1InternalTrace.labelAllocations.length} labels`);
  lines.push(`  Final Weights: ${Object.keys(audit.rawStep1InternalTrace.finalWeights).length} countries`);
  lines.push('');
  
  lines.push('UI Display:');
  lines.push(`  Display Labels: ${audit.formattedUIPayload.displayLabels.length}`);
  lines.push(`  Fallback Summary: ${audit.formattedUIPayload.fallbackSummary}`);
  lines.push(`  Channel Breakdown: ${Object.keys(audit.formattedUIPayload.channelBreakdown).length} countries`);
  lines.push('');
  
  if (audit.mismatches.length === 0) {
    lines.push('✅ No mismatches detected - UI accurately reflects computation');
  } else {
    lines.push(`⚠️  ${audit.mismatches.length} mismatch(es) detected:`);
    lines.push('');
    
    for (const mismatch of audit.mismatches) {
      lines.push(`  ${mismatch.type.toUpperCase()}:`);
      lines.push(`    ${mismatch.description}`);
      if (mismatch.expected !== null) {
        lines.push(`    Expected: ${JSON.stringify(mismatch.expected)}`);
      }
      if (mismatch.actual !== null) {
        lines.push(`    Actual: ${JSON.stringify(mismatch.actual)}`);
      }
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

/**
 * Validate UI consistency
 */
export function validateUIConsistency(audit: UIMappingAudit): {
  isConsistent: boolean;
  criticalMismatches: number;
  warningMismatches: number;
  summary: string;
} {
  
  let criticalMismatches = 0;
  let warningMismatches = 0;
  
  for (const mismatch of audit.mismatches) {
    if (mismatch.type === 'weight_mismatch') {
      criticalMismatches++;
    } else {
      warningMismatches++;
    }
  }
  
  const isConsistent = criticalMismatches === 0;
  
  let summary: string;
  if (isConsistent && warningMismatches === 0) {
    summary = 'UI is fully consistent with computation';
  } else if (isConsistent) {
    summary = `UI is consistent but has ${warningMismatches} warning(s)`;
  } else {
    summary = `UI has ${criticalMismatches} critical mismatch(es) and ${warningMismatches} warning(s)`;
  }
  
  return {
    isConsistent,
    criticalMismatches,
    warningMismatches,
    summary
  };
}

// ============================================================================
// Helper Types
// ============================================================================

export interface RawStep1TraceData {
  directAllocations: Map<string, number>;
  labelAllocations: {
    label: string;
    mechanism: string;
    members: Set<string>;
    exclusions: Set<string>;
    allocation: Map<string, number>;
  }[];
  finalWeights: Map<string, number>;
  stepLog: string[];
}