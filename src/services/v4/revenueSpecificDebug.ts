/**
 * Revenue-Specific Debug Service
 * 
 * Provides detailed per-label allocation and provenance for Revenue channel
 */

import {
  RevenueSpecificDebug,
  RevenueLabelAllocation,
  RevenueCountryProvenance
} from './types/debugBundle.types';

/**
 * Create revenue-specific debug section
 */
export function createRevenueSpecificDebug(
  labelAllocations: RevenueLabelData[],
  finalWeights: Map<string, number>
): RevenueSpecificDebug {
  
  // Convert label allocations
  const labelAllocationsDebug: RevenueLabelAllocation[] = labelAllocations.map(label => ({
    segmentLabel: label.label,
    membershipSet: Array.from(label.members),
    exclusions: Array.from(label.exclusions),
    fallbackUsed: label.fallbackUsed,
    outputWeights: Object.fromEntries(label.allocation.entries())
  }));
  
  // Build per-country provenance
  const perCountryProvenance = buildRevenueCountryProvenance(labelAllocations, finalWeights);
  
  return {
    labelAllocations: labelAllocationsDebug,
    perCountryProvenance
  };
}

/**
 * Build per-country provenance for revenue channel
 */
function buildRevenueCountryProvenance(
  labelAllocations: RevenueLabelData[],
  finalWeights: Map<string, number>
): RevenueCountryProvenance[] {
  
  const provenanceMap = new Map<string, {
    contributingLabels: Set<string>;
    breakdown: Map<string, number>;
  }>();
  
  // Track contributions from each label
  for (const label of labelAllocations) {
    for (const [country, weight] of label.allocation.entries()) {
      if (!provenanceMap.has(country)) {
        provenanceMap.set(country, {
          contributingLabels: new Set(),
          breakdown: new Map()
        });
      }
      
      const prov = provenanceMap.get(country)!;
      prov.contributingLabels.add(label.label);
      prov.breakdown.set(label.label, weight);
    }
  }
  
  // Convert to array format
  const provenance: RevenueCountryProvenance[] = [];
  
  for (const [country, data] of provenanceMap.entries()) {
    const totalWeight = finalWeights.get(country) || 0;
    
    provenance.push({
      country,
      contributingLabels: Array.from(data.contributingLabels),
      totalWeight,
      breakdown: Object.fromEntries(data.breakdown.entries())
    });
  }
  
  // Sort by total weight descending
  provenance.sort((a, b) => b.totalWeight - a.totalWeight);
  
  return provenance;
}

/**
 * Validate revenue segment allocations
 */
export function validateRevenueSegments(
  revenueDebug: RevenueSpecificDebug,
  expectedSegments: string[]
): {
  isValid: boolean;
  missingSegments: string[];
  unexpectedSegments: string[];
  summary: string;
} {
  
  const actualSegments = new Set(revenueDebug.labelAllocations.map(l => l.segmentLabel));
  const expectedSet = new Set(expectedSegments);
  
  const missingSegments: string[] = [];
  const unexpectedSegments: string[] = [];
  
  for (const expected of expectedSet) {
    if (!actualSegments.has(expected)) {
      missingSegments.push(expected);
    }
  }
  
  for (const actual of actualSegments) {
    if (!expectedSet.has(actual)) {
      unexpectedSegments.push(actual);
    }
  }
  
  const isValid = missingSegments.length === 0 && unexpectedSegments.length === 0;
  
  let summary: string;
  if (isValid) {
    summary = `All ${expectedSegments.length} expected revenue segments present`;
  } else {
    summary = `Missing: ${missingSegments.length}, Unexpected: ${unexpectedSegments.length}`;
  }
  
  return {
    isValid,
    missingSegments,
    unexpectedSegments,
    summary
  };
}

/**
 * Check for double counting in revenue segments
 */
export function checkRevenueDoubleCount(
  revenueDebug: RevenueSpecificDebug
): {
  hasDoubleCount: boolean;
  affectedCountries: string[];
  details: {
    country: string;
    segments: string[];
    totalContribution: number;
  }[];
} {
  
  const affectedCountries: string[] = [];
  const details: {
    country: string;
    segments: string[];
    totalContribution: number;
  }[] = [];
  
  for (const prov of revenueDebug.perCountryProvenance) {
    if (prov.contributingLabels.length > 1) {
      affectedCountries.push(prov.country);
      
      details.push({
        country: prov.country,
        segments: prov.contributingLabels,
        totalContribution: prov.totalWeight
      });
    }
  }
  
  return {
    hasDoubleCount: affectedCountries.length > 0,
    affectedCountries,
    details
  };
}

/**
 * Generate revenue-specific report
 */
export function generateRevenueReport(revenueDebug: RevenueSpecificDebug): string {
  
  const lines: string[] = [];
  
  lines.push('=== REVENUE-SPECIFIC DEBUG REPORT ===');
  lines.push('');
  
  lines.push(`Total Segments: ${revenueDebug.labelAllocations.length}`);
  lines.push('');
  
  lines.push('Segment Allocations:');
  for (const segment of revenueDebug.labelAllocations) {
    lines.push(`  ${segment.segmentLabel}:`);
    lines.push(`    Membership: ${segment.membershipSet.length} countries`);
    lines.push(`    Exclusions: ${segment.exclusions.length > 0 ? segment.exclusions.join(', ') : 'none'}`);
    lines.push(`    Fallback: ${segment.fallbackUsed}`);
    
    const weights = Object.entries(segment.outputWeights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    lines.push(`    Top 5 Countries:`);
    for (const [country, weight] of weights) {
      lines.push(`      ${country.padEnd(20)} ${(weight * 100).toFixed(2)}%`);
    }
    lines.push('');
  }
  
  lines.push('Per-Country Provenance (Top 10):');
  const top10 = revenueDebug.perCountryProvenance.slice(0, 10);
  
  for (const prov of top10) {
    lines.push(`  ${prov.country.padEnd(25)} ${(prov.totalWeight * 100).toFixed(2)}%`);
    lines.push(`    Contributing Segments: ${prov.contributingLabels.join(', ')}`);
    
    for (const [segment, weight] of Object.entries(prov.breakdown)) {
      lines.push(`      ← ${segment.padEnd(20)} ${(weight * 100).toFixed(2)}%`);
    }
    lines.push('');
  }
  
  // Check for double counting
  const doubleCountCheck = checkRevenueDoubleCount(revenueDebug);
  
  if (doubleCountCheck.hasDoubleCount) {
    lines.push('⚠️  DOUBLE COUNTING DETECTED:');
    for (const detail of doubleCountCheck.details) {
      lines.push(`  ${detail.country}: appears in ${detail.segments.join(', ')}`);
    }
  } else {
    lines.push('✅ No double counting detected');
  }
  
  return lines.join('\n');
}

// ============================================================================
// Helper Types
// ============================================================================

export interface RevenueLabelData {
  label: string;
  members: Set<string>;
  exclusions: Set<string>;
  fallbackUsed: 'SSF' | 'RF_A' | 'none';
  allocation: Map<string, number>;
}