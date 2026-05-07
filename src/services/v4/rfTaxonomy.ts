/**
 * RF Taxonomy Classification Service - V.4 Compliant
 * 
 * Classifies RF-A/B/C/D types based on evidence structure.
 * V.4 Key: RF types are NOT selected by keywords, but by evidence structure.
 * STEP 1 FIX: Added classifyRFTypeForLabel for label-specific RF classification
 */

import { FallbackType, StructuredItem, NarrativeMentions, EvidenceBundle, EntityKind } from '@/types/v4Types';

/**
 * Decide RF case for channel-level allocation (when NO closed totals exist)
 * V.4 compliant: NOT name-keyword based
 */
export function decideRFCase_V4(evidenceBundle: EvidenceBundle): FallbackType {
  
  // RF-D: partial structured numeric evidence exists (non-exhaustive), no totals
  if (hasPartialStructuredEvidence(evidenceBundle.structuredItems, evidenceBundle.channel)) {
    return FallbackType.RF_D;
  }
  
  // RF-B: countries explicitly named (membership hints), no totals
  if (evidenceBundle.narrative.namedCountries.size > 0 || 
      evidenceBundle.supplementaryMembershipHints.namedCountries.size > 0) {
    return FallbackType.RF_B;
  }
  
  // RF-C: only geo labels named (membership hints), no totals
  if (evidenceBundle.narrative.geoLabels.size > 0 || 
      evidenceBundle.narrative.nonStandardLabels.size > 0) {
    return FallbackType.RF_C;
  }
  
  // Default conservative when membership evidence exists
  return FallbackType.RF_C;
}

/**
 * STEP 1 FIX: Classify RF type for a specific label based on available evidence
 * Used when label has closed total but membership is not resolvable
 * Priority: RF-B (named countries) > RF-C (geo labels, excluding residual labels) > RF-D (partial structured) > RF-A (none)
 */
export function classifyRFTypeForLabel(
  label: string,
  evidenceBundle: EvidenceBundle
): FallbackType {
  
  // STEP 1 FIX: Check for named countries FIRST (highest priority for accuracy)
  // Named countries provide the most specific membership evidence
  if (evidenceBundle.narrative.namedCountries.size > 0 || 
      evidenceBundle.supplementaryMembershipHints.namedCountries.size > 0) {
    return FallbackType.RF_B;
  }
  
  // Check for geo labels (second priority)
  // BUT exclude the current label itself from the check (it's the residual label we're trying to allocate)
  const hasGeoLabelsExcludingCurrent = 
    evidenceBundle.narrative.geoLabels.size > 0 ||
    evidenceBundle.supplementaryMembershipHints.geoLabels.size > 0 ||
    (evidenceBundle.narrative.nonStandardLabels.size > 0 && 
     !isOnlyNonStandardLabel(label, evidenceBundle.narrative.nonStandardLabels));
  
  if (hasGeoLabelsExcludingCurrent) {
    return FallbackType.RF_C;
  }
  
  // PHASE 1 FIX: Check for partial structured evidence (third priority)
  // BUT exclude the current label from the check - if it's the ONLY structured item, it's not "partial"
  if (hasPartialStructuredEvidenceExcludingLabel(evidenceBundle.structuredItems, label, evidenceBundle.channel)) {
    return FallbackType.RF_D;
  }
  
  // Default: RF-A (conservative, no membership evidence)
  return FallbackType.RF_A;
}

/**
 * Check if the given label is the only non-standard label in the set
 */
function isOnlyNonStandardLabel(label: string, nonStandardLabels: Set<string>): boolean {
  return nonStandardLabels.size === 1 && nonStandardLabels.has(label);
}

/**
 * PHASE 1 FIX: Check if partial structured evidence exists, excluding the current label
 * This prevents RF-D when the only structured item is the residual label itself
 */
function hasPartialStructuredEvidenceExcludingLabel(
  structuredItems: StructuredItem[],
  currentLabel: string,
  channel: string
): boolean {
  // Filter out the current label
  const otherItems = structuredItems.filter(item => item.canonicalLabel !== currentLabel);
  
  if (otherItems.length === 0) {
    return false;
  }
  
  // Check if OTHER items (excluding current label) form partial evidence
  return hasPartialStructuredEvidence(otherItems, channel);
}

/**
 * Check if partial structured evidence exists (non-exhaustive tables)
 * STEP 1 FIX: Exported for reuse in v4Orchestrator
 * PHASE 1 FIX: Only consider COUNTRY entities, not NONSTANDARD_LABEL entities
 */
export function hasPartialStructuredEvidence(structuredItems: StructuredItem[], channel: string): boolean {
  if (structuredItems.length === 0) {
    return false;
  }
  
  // PHASE 1 FIX: Only consider actual country allocations, not residual labels
  const countryItems = structuredItems.filter(item => 
    item.entityKind === EntityKind.COUNTRY && !item.isTotalRow
  );
  
  if (countryItems.length === 0) {
    return false;
  }
  
  // Check if we have some structured items but they don't form a complete picture
  // Indicators of partial evidence:
  // 1. Has "Other" or "Rest of" entries (but only if they're COUNTRY entities)
  // 2. Has numeric values but no total row
  // 3. Has only a few countries (< 5) without totaling to 100%
  
  const hasOtherLabel = countryItems.some(item => 
    item.canonicalLabel.toLowerCase().includes('other') ||
    item.canonicalLabel.toLowerCase().includes('rest of')
  );
  
  const hasTotalRow = structuredItems.some(item => item.isTotalRow);
  
  const countryCount = countryItems.length;
  
  // If has "Other" label among countries, definitely partial
  if (hasOtherLabel) {
    return true;
  }
  
  // If no total row and few countries, likely partial
  if (!hasTotalRow && countryCount > 0 && countryCount < 5) {
    return true;
  }
  
  // If has values but they don't sum to ~100%, likely partial
  const pctItems = countryItems.filter(item => item.unit === 'pct');
  
  if (pctItems.length > 0) {
    const sum = pctItems.reduce((acc, item) => acc + item.value, 0);
    // If sum is significantly less than 1.0 (100%), it's partial
    if (sum < 0.80) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if narrative mentions specific countries
 */
export function mentionsSpecificCountries(narrative: string): boolean {
  // Simple check for country name patterns
  const countryPatterns = [
    /United States/i,
    /China/i,
    /Japan/i,
    /Germany/i,
    /United Kingdom/i,
    /France/i,
    /India/i,
    /Brazil/i,
    /Canada/i,
    /Australia/i
  ];
  
  return countryPatterns.some(pattern => pattern.test(narrative));
}

/**
 * Check if narrative defines a restricted set
 */
export function definesRestrictedSet(narrative: string): boolean {
  // Check for phrases like "primarily in", "mainly in", "concentrated in"
  const patterns = [
    /primarily in ([A-Za-z\s,]+)/i,
    /mainly in ([A-Za-z\s,]+)/i,
    /concentrated in ([A-Za-z\s,]+)/i,
    /located in ([A-Za-z\s,]+)/i,
    /operates in ([A-Za-z\s,]+)/i,
    /present in ([A-Za-z\s,]+)/i
  ];
  
  return patterns.some(p => p.test(narrative));
}

/**
 * Classify narrative mention type
 */
export function classifyNarrativeMention(
  sentence: string, 
  channel: string
): { type: string; confidence: number; reasoning: string } {
  
  const lower = sentence.toLowerCase();
  
  // Detect explicit numeric magnitudes (rare; still NOT used unless it forms a closed allocatable total)
  const hasNumeric = lower.includes('%') || 
                     lower.includes('$') || 
                     lower.includes('million') || 
                     lower.includes('billion');
  
  if (hasNumeric) {
    return {
      type: 'numeric_mention',
      confidence: 0.80,
      reasoning: 'numeric mentioned in narrative'
    };
  }
  
  // Otherwise treat as membership hint
  return {
    type: 'membership_hint',
    confidence: 0.70,
    reasoning: 'narrative membership hint'
  };
}

/**
 * Calculate ambiguity level for label definition
 */
export function ambiguityLevelForLabel(defn: any | null): string {
  if (defn === null) {
    return 'unknown';
  }
  
  // If definition contains "other/various/certain", treat as ambiguous
  if (defn.confidence < 0.75) {
    return 'high';
  }
  
  return 'low';
}

/**
 * Check if any geography membership evidence exists
 */
export function anyGeographyMembershipEvidenceExists(evidenceBundle: EvidenceBundle): boolean {
  const n = evidenceBundle.narrative;
  const s = evidenceBundle.supplementaryMembershipHints;
  
  return (n.namedCountries.size + n.geoLabels.size + n.nonStandardLabels.size + n.currencyLabels.size > 0) ||
         (s.namedCountries.size + s.geoLabels.size + s.nonStandardLabels.size + s.currencyLabels.size > 0);
}