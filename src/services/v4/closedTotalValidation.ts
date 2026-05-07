/**
 * Closed-Total Validation Service - V.4 Compliant
 * 
 * Implements closed-total gating logic.
 * V.4 Key: "Closed allocatable numeric total" refers to NUMERIC TOTAL existence,
 * not "membership fully known".
 */

import { StructuredItem, ValidationResult, LabelDefinition } from '@/types/v4Types';

/**
 * Check if table has closed total (sums to ~100% or has explicit total row)
 */
export function isClosedTotal(
  tableData: StructuredItem[],
  tolerance: number = 0.01
): boolean {
  
  // Check for explicit total row
  const hasTotalRow = tableData.some(item => item.isTotalRow);
  if (hasTotalRow) {
    return true;
  }
  
  // Check if percentages sum to ~100%
  const pctItems = tableData.filter(item => item.unit === 'pct' && !item.isTotalRow);
  if (pctItems.length > 0) {
    const sum = pctItems.reduce((acc, item) => acc + item.value, 0);
    return Math.abs(sum - 1.0) <= tolerance;
  }
  
  // For absolute values, we can't determine closed total without context
  return false;
}

/**
 * Validate closed total with detailed message
 */
export function validateClosedTotal(
  tableData: StructuredItem[],
  channel: string
): ValidationResult {
  
  const pctItems = tableData.filter(item => item.unit === 'pct' && !item.isTotalRow);
  
  if (pctItems.length === 0) {
    return {
      valid: false,
      total: 0,
      message: `[${channel}] No percentage items found, cannot validate closed total`
    };
  }
  
  const total = pctItems.reduce((sum, item) => sum + item.value, 0);
  const valid = Math.abs(total - 1.0) <= 0.01;
  
  if (!valid) {
    return {
      valid: false,
      total,
      message: `[${channel}] Table total (${(total * 100).toFixed(2)}%) != 100%, treating as incomplete evidence`
    };
  }
  
  return {
    valid: true,
    total,
    message: `[${channel}] Closed-total verified ✓`
  };
}

/**
 * Check if label has closed allocatable total
 * V.4: True if the structured table provides a numeric total for this label
 */
export function labelHasClosedAllocatableTotal(
  label: string,
  structuredItems: StructuredItem[]
): boolean {
  
  // Find the item for this label
  const labelItem = structuredItems.find(item => 
    item.canonicalLabel === label && !item.isTotalRow
  );
  
  if (!labelItem) {
    return false;
  }
  
  // Must have a numeric value
  return labelItem.value !== null && labelItem.value !== undefined && !isNaN(labelItem.value);
}

/**
 * Find all labels with closed allocatable totals
 * STEP 1 FIX: Include COUNTRY entities that have definitions (they're actually buckets/labels)
 */
export function findClosedTotalLabels(
  structuredItems: StructuredItem[],
  definitions?: Map<string, LabelDefinition>
): Set<string> {
  const labels = new Set<string>();
  
  for (const item of structuredItems) {
    if (item.isTotalRow) {
      continue;
    }
    
    // Check if it's a label (not a direct country) with a numeric value
    if ((item.entityKind === 'GEO_LABEL' || item.entityKind === 'NONSTANDARD_LABEL') &&
        item.value !== null && item.value !== undefined && !isNaN(item.value)) {
      labels.add(item.canonicalLabel);
    }
    
    // STEP 1 FIX: If it's a COUNTRY but has a definition, treat it as a label (it's a bucket)
    if (item.entityKind === 'COUNTRY' &&
        item.value !== null && item.value !== undefined && !isNaN(item.value) &&
        definitions && definitions.has(item.canonicalLabel)) {
      labels.add(item.canonicalLabel);
    }
  }
  
  return labels;
}

/**
 * Get total row value if any
 */
export function getTotalRowValueIfAny(structuredItems: StructuredItem[]): number | null {
  const totalRow = structuredItems.find(item => item.isTotalRow);
  return totalRow ? totalRow.value : null;
}

/**
 * Infer unit mode (pct, abs, or mixed)
 */
export function inferUnitMode(structuredItems: StructuredItem[]): 'pct' | 'abs' | 'mixed' {
  const nonTotalItems = structuredItems.filter(item => !item.isTotalRow);
  
  const hasPct = nonTotalItems.some(item => item.unit === 'pct');
  const hasAbs = nonTotalItems.some(item => item.unit === 'abs');
  
  if (hasPct && hasAbs) {
    return 'mixed';
  } else if (hasPct) {
    return 'pct';
  } else if (hasAbs) {
    return 'abs';
  }
  
  return 'pct'; // default
}

/**
 * Compute label total weight
 */
export function computeLabelTotalWeight(
  label: string,
  structuredItems: StructuredItem[],
  unitMode: 'pct' | 'abs' | 'mixed',
  totalRowValue: number | null
): number {
  
  const labelItem = structuredItems.find(item => 
    item.canonicalLabel === label && !item.isTotalRow
  );
  
  if (!labelItem) {
    return 0;
  }
  
  // If already in percentage, return as-is
  if (labelItem.unit === 'pct') {
    return labelItem.value;
  }
  
  // If absolute and we have a total, convert to percentage
  if (labelItem.unit === 'abs' && totalRowValue && totalRowValue > 0) {
    return labelItem.value / totalRowValue;
  }
  
  // Otherwise return raw value (will be normalized later)
  return labelItem.value;
}

/**
 * Validate structured evidence (V4-aligned)
 */
export function validateStructuredEvidence(structuredItems: StructuredItem[]): Array<{
  rule: string;
  passed: boolean;
  severity: 'INFO' | 'WARN' | 'ERROR';
}> {
  
  const results = [];
  
  // V4 NOTE: Do NOT require sum-to-1 at parsing time
  const hasPct = structuredItems.some(item => item.unit === 'pct' && !item.isTotalRow);
  const hasAbs = structuredItems.some(item => item.unit === 'abs' && !item.isTotalRow);
  
  if (hasPct) {
    const sumPct = structuredItems
      .filter(item => item.unit === 'pct' && !item.isTotalRow)
      .reduce((sum, item) => sum + item.value, 0);
    
    const passed = sumPct <= 1.01;
    results.push({
      rule: 'V1: pct sum <= 1.0 (+tolerance)',
      passed,
      severity: passed ? 'INFO' : 'WARN'
    });
  }
  
  // Duplicate label sanity
  const countryLabels = structuredItems
    .filter(item => item.entityKind === 'COUNTRY')
    .map(item => item.canonicalLabel);
  
  const duplicates = countryLabels.filter((label, index) => 
    countryLabels.indexOf(label) !== index
  );
  
  const noDupes = duplicates.length === 0;
  results.push({
    rule: 'V2: no duplicate country labels',
    passed: noDupes,
    severity: noDupes ? 'INFO' : 'WARN'
  });
  
  // Non-negative
  const hasNegative = structuredItems.some(item => 
    !item.isTotalRow && item.value < 0
  );
  
  results.push({
    rule: 'V3: non-negative values',
    passed: !hasNegative,
    severity: !hasNegative ? 'INFO' : 'ERROR'
  });
  
  return results;
}

/**
 * Calculate structured confidence score
 */
export function calculateStructuredConfidence(
  structuredItems: StructuredItem[],
  validationResults: Array<{ passed: boolean }>
): number {
  
  const base = 0.85;
  const passRate = validationResults.filter(r => r.passed).length / 
                   Math.max(1, validationResults.length);
  
  const conf = base + 0.10 * passRate;
  return Math.max(0.0, Math.min(0.95, conf));
}