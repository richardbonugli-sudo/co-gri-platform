/**
 * Integrity Checks Service
 * 
 * Detects double-counting and tracks country-to-source provenance
 */

import {
  IntegrityChecks,
  CountryProvenance,
  SourceContribution,
  DoubleCountingDetail
} from './types/debugBundle.types';

/**
 * Perform integrity checks on merged allocations
 */
export function performIntegrityChecks(
  preNormalizeWeights: Map<string, number>,
  postNormalizeWeights: Map<string, number>,
  countryToSourceMap: Map<string, SourceContribution[]>
): IntegrityChecks {
  
  // Calculate sums
  const preNormalizeSum = Array.from(preNormalizeWeights.values()).reduce((sum, w) => sum + w, 0);
  const postNormalizeSum = Array.from(postNormalizeWeights.values()).reduce((sum, w) => sum + w, 0);
  
  // Build country provenance
  const countryProvenance: CountryProvenance[] = [];
  
  for (const [country, sources] of countryToSourceMap.entries()) {
    const totalWeight = postNormalizeWeights.get(country) || 0;
    
    countryProvenance.push({
      country,
      totalWeight,
      sources: sources.map(s => ({
        label: s.label,
        weight: s.weight,
        mechanism: s.mechanism
      }))
    });
  }
  
  // Sort by total weight descending
  countryProvenance.sort((a, b) => b.totalWeight - a.totalWeight);
  
  // Detect double counting
  const doubleCountingResult = detectDoubleCounting(countryToSourceMap);
  
  return {
    preNormalizeSum,
    postNormalizeSum,
    countryContributionsBySource: countryProvenance,
    doubleCountingDetected: doubleCountingResult.detected,
    doubleCountingDetails: doubleCountingResult.details
  };
}

/**
 * Detect double counting across labels
 */
function detectDoubleCounting(
  countryToSourceMap: Map<string, SourceContribution[]>
): {
  detected: boolean;
  details: DoubleCountingDetail[];
} {
  
  const details: DoubleCountingDetail[] = [];
  let detected = false;
  
  for (const [country, sources] of countryToSourceMap.entries()) {
    // Check if country appears in multiple labels
    if (sources.length > 1) {
      const overlappingLabels = sources.map(s => s.label);
      const totalOverlap = sources.reduce((sum, s) => sum + s.weight, 0);
      
      // Only flag as double counting if it's not from direct allocation
      const nonDirectSources = sources.filter(s => s.mechanism !== 'direct');
      
      if (nonDirectSources.length > 1) {
        detected = true;
        details.push({
          country,
          overlappingLabels,
          totalOverlap
        });
      }
    }
  }
  
  return { detected, details };
}

/**
 * Build country-to-source provenance map
 * CRITICAL FIX: Added null/undefined checks for directAllocations and allocation maps
 */
export function buildProvenanceMap(
  directAllocations: Map<string, number>,
  labelAllocations: LabelAllocationResult[]
): Map<string, SourceContribution[]> {
  
  const provenanceMap = new Map<string, SourceContribution[]>();
  
  // CRITICAL FIX: Check if directAllocations exists before calling .entries()
  if (directAllocations && directAllocations.size > 0) {
    // Add direct allocations
    for (const [country, weight] of directAllocations.entries()) {
      if (!provenanceMap.has(country)) {
        provenanceMap.set(country, []);
      }
      
      provenanceMap.get(country)!.push({
        label: 'Direct Country',
        weight,
        mechanism: 'direct'
      });
    }
  }
  
  // CRITICAL FIX: Check if labelAllocations exists and has items
  if (labelAllocations && labelAllocations.length > 0) {
    // Add label allocations
    for (const labelResult of labelAllocations) {
      // CRITICAL FIX: Check if allocation exists before calling .entries()
      if (labelResult.allocation && labelResult.allocation.size > 0) {
        for (const [country, weight] of labelResult.allocation.entries()) {
          if (!provenanceMap.has(country)) {
            provenanceMap.set(country, []);
          }
          
          provenanceMap.get(country)!.push({
            label: labelResult.label,
            weight,
            mechanism: labelResult.mechanism
          });
        }
      }
    }
  }
  
  return provenanceMap;
}

/**
 * Merge allocations and track provenance
 */
export function mergeAllocationsWithProvenance(
  directAllocations: Map<string, number>,
  labelAllocations: LabelAllocationResult[]
): {
  mergedWeights: Map<string, number>;
  provenanceMap: Map<string, SourceContribution[]>;
} {
  
  const mergedWeights = new Map<string, number>();
  const provenanceMap = buildProvenanceMap(directAllocations, labelAllocations);
  
  // CRITICAL FIX: Check if directAllocations exists
  if (directAllocations && directAllocations.size > 0) {
    // Merge all weights
    for (const [country, weight] of directAllocations.entries()) {
      mergedWeights.set(country, (mergedWeights.get(country) || 0) + weight);
    }
  }
  
  // CRITICAL FIX: Check if labelAllocations exists
  if (labelAllocations && labelAllocations.length > 0) {
    for (const labelResult of labelAllocations) {
      // CRITICAL FIX: Check if allocation exists
      if (labelResult.allocation && labelResult.allocation.size > 0) {
        for (const [country, weight] of labelResult.allocation.entries()) {
          mergedWeights.set(country, (mergedWeights.get(country) || 0) + weight);
        }
      }
    }
  }
  
  return { mergedWeights, provenanceMap };
}

/**
 * Normalize weights to sum to 1.0
 */
export function normalizeWeights(
  weights: Map<string, number>
): Map<string, number> {
  
  const total = Array.from(weights.values()).reduce((sum, w) => sum + w, 0);
  
  if (total <= 0) {
    return new Map();
  }
  
  const normalized = new Map<string, number>();
  for (const [country, weight] of weights.entries()) {
    normalized.set(country, weight / total);
  }
  
  return normalized;
}

/**
 * Validate normalization
 */
export function validateNormalization(
  normalizedWeights: Map<string, number>,
  tolerance: number = 0.0001
): {
  isValid: boolean;
  sum: number;
  error: number;
} {
  
  const sum = Array.from(normalizedWeights.values()).reduce((s, w) => s + w, 0);
  const error = Math.abs(sum - 1.0);
  
  return {
    isValid: error <= tolerance,
    sum,
    error
  };
}

/**
 * Generate integrity report
 */
export function generateIntegrityReport(
  integrityChecks: IntegrityChecks
): string {
  
  const lines: string[] = [];
  
  lines.push('=== INTEGRITY CHECKS REPORT ===');
  lines.push('');
  lines.push(`Pre-Normalize Sum:  ${integrityChecks.preNormalizeSum.toFixed(6)}`);
  lines.push(`Post-Normalize Sum: ${integrityChecks.postNormalizeSum.toFixed(6)}`);
  lines.push(`Normalization Valid: ${Math.abs(integrityChecks.postNormalizeSum - 1.0) < 0.0001 ? 'YES' : 'NO'}`);
  lines.push('');
  
  lines.push(`Double Counting Detected: ${integrityChecks.doubleCountingDetected ? 'YES' : 'NO'}`);
  
  if (integrityChecks.doubleCountingDetected && integrityChecks.doubleCountingDetails) {
    lines.push('');
    lines.push('Double Counting Details:');
    for (const detail of integrityChecks.doubleCountingDetails) {
      lines.push(`  ${detail.country}:`);
      lines.push(`    Overlapping Labels: ${detail.overlappingLabels.join(', ')}`);
      lines.push(`    Total Overlap: ${(detail.totalOverlap * 100).toFixed(2)}%`);
    }
  }
  
  lines.push('');
  lines.push(`Total Countries: ${integrityChecks.countryContributionsBySource.length}`);
  lines.push('');
  lines.push('Top 10 Countries by Weight:');
  
  const top10 = integrityChecks.countryContributionsBySource.slice(0, 10);
  for (const country of top10) {
    lines.push(`  ${country.country.padEnd(25)} ${(country.totalWeight * 100).toFixed(2)}%`);
    for (const source of country.sources) {
      lines.push(`    ← ${source.label.padEnd(20)} ${(source.weight * 100).toFixed(2)}% (${source.mechanism})`);
    }
  }
  
  return lines.join('\n');
}

// ============================================================================
// Helper Types
// ============================================================================

export interface LabelAllocationResult {
  label: string;
  mechanism: 'SSF' | 'RF_A' | 'RF_B' | 'RF_C' | 'RF_D' | 'GF';
  allocation: Map<string, number>;
}