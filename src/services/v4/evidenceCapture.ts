/**
 * Evidence Capture Service - V.4 Compliant
 * 
 * Captures and structures evidence from evidence bundles.
 * PRIORITY 3 FIX: Added comprehensive validation checks for evidence quality and channel isolation
 */

import {
  Channel,
  EvidenceBundle,
  StructuredItem,
  EntityKind,
  NarrativeMentions
} from '@/types/v4Types';

import {
  Step0Evidence,
  StructuredEvidence,
  DetectedTable,
  StructuredItemDebug,
  NarrativeExtraction,
  NarrativeDefinitionDebug,
  SupplementaryHints
} from './types/debugBundle.types';

/**
 * PRIORITY 3: Validation interfaces
 */
interface ValidationWarning {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'contamination' | 'entity_kind' | 'source_ref' | 'completeness' | 'confidence';
  message: string;
  channel: Channel;
  details: any;
}

interface ValidationReport {
  isValid: boolean;
  warnings: ValidationWarning[];
  timestamp: string;
  channel: Channel;
}

/**
 * Capture Step-0 evidence bundle for debug output
 */
export function captureStep0Evidence(
  evidenceBundle: EvidenceBundle,
  channel: Channel
): Step0Evidence {
  
  return {
    channel: channel.toString(),
    structuredEvidence: captureStructuredEvidence(evidenceBundle, channel),
    narrativeExtraction: captureNarrativeExtraction(evidenceBundle),
    supplementaryHints: captureSupplementaryHints(evidenceBundle)
  };
}

/**
 * Capture structured evidence with table detection
 */
export function captureStructuredEvidence(
  evidenceBundle: EvidenceBundle,
  channel: Channel
): StructuredEvidence {
  
  // Detect tables from structured items
  const detectedTables = detectTables(evidenceBundle, channel);
  
  // Convert structured items to debug format
  const structuredItems: StructuredItemDebug[] = evidenceBundle.structuredItems.map(item => ({
    rawLabel: item.rawLabel,
    canonicalLabel: item.canonicalLabel,
    entityKind: item.entityKind.toString() as 'COUNTRY' | 'GEO_LABEL' | 'NONSTANDARD' | 'CURRENCY_LABEL',
    value: item.value,
    unit: item.unit,
    isTotalRow: item.isTotalRow || false,
    sourceRef: item.sourceRef
  }));
  
  return {
    detected_tables: detectedTables,
    structuredItems
  };
}

/**
 * Detect tables from structured items
 */
function detectTables(
  evidenceBundle: EvidenceBundle,
  channel: Channel
): DetectedTable[] {
  
  const tables: DetectedTable[] = [];
  
  // Group items by source reference to identify tables
  const tableGroups = new Map<string, StructuredItemDebug[]>();
  
  for (const item of evidenceBundle.structuredItems) {
    const sourceRef = item.sourceRef || 'Unknown Source';
    if (!tableGroups.has(sourceRef)) {
      tableGroups.set(sourceRef, []);
    }
    tableGroups.get(sourceRef)!.push({
      rawLabel: item.rawLabel,
      canonicalLabel: item.canonicalLabel,
      entityKind: item.entityKind.toString() as 'COUNTRY' | 'GEO_LABEL' | 'NONSTANDARD' | 'CURRENCY_LABEL',
      value: item.value,
      unit: item.unit,
      isTotalRow: item.isTotalRow || false,
      sourceRef: item.sourceRef
    });
  }
  
  // Create table entries
  let tableId = 1;
  for (const [sourceRef, items] of tableGroups.entries()) {
    // Determine section name based on channel and source
    let sectionName = 'Unknown Section';
    let headerText = sourceRef;
    
    if (channel === Channel.REVENUE) {
      sectionName = 'Revenue by Geographic Segment';
      headerText = 'Net Sales by Geographic Segment';
    } else if (channel === Channel.ASSETS) {
      sectionName = 'Property, Plant & Equipment';
      headerText = 'Long-Lived Assets by Geographic Location';
    } else if (channel === Channel.FINANCIAL) {
      sectionName = 'Financial Exposure';
      headerText = 'Currency Composition';
    } else if (channel === Channel.SUPPLY) {
      sectionName = 'Supply Chain';
      headerText = 'Manufacturing and Supply';
    }
    
    // Check if table has closed total
    const hasTotalRow = items.some(item => item.isTotalRow);
    
    tables.push({
      table_id: `table_${tableId}`,
      section_name: sectionName,
      header_text: headerText,
      page_anchor: undefined,
      line_anchor: undefined,
      row_count: items.length
    });
    
    tableId++;
  }
  
  return tables;
}

/**
 * Capture narrative extraction
 */
function captureNarrativeExtraction(
  evidenceBundle: EvidenceBundle
): NarrativeExtraction {
  
  const narrative = evidenceBundle.narrative;
  
  // Convert definitions to debug format
  const definitions: NarrativeDefinitionDebug[] = [];
  for (const [label, def] of narrative.definitions.entries()) {
    definitions.push({
      label,
      includes: def.includes,
      excludes: def.excludes,
      residualOf: def.residualOf,
      confidence: def.confidence,
      sourceRef: def.sourceRef
    });
  }
  
  return {
    namedCountries: Array.from(narrative.namedCountries),
    geoLabels: Array.from(narrative.geoLabels),
    nonStandardLabels: Array.from(narrative.nonStandardLabels),
    definitions
  };
}

/**
 * Capture supplementary hints
 */
function captureSupplementaryHints(
  evidenceBundle: EvidenceBundle
): SupplementaryHints {
  
  const hints = evidenceBundle.supplementaryMembershipHints;
  
  return {
    namedCountries: Array.from(hints.namedCountries),
    geoLabels: Array.from(hints.geoLabels),
    nonStandardLabels: Array.from(hints.nonStandardLabels),
    source: 'Supplementary membership analysis'
  };
}

/**
 * Analyze PP&E table detection for Assets channel
 */
export function analyzePPETableDetection(
  structuredEvidence: StructuredEvidence
): {
  ppeTableDetected: boolean;
  ppeTableId?: string;
  longLivedAssetsFound: boolean;
  itemCount: number;
} {
  
  // Look for PP&E or long-lived assets table
  const ppeTable = structuredEvidence.detected_tables.find(table => 
    table.section_name.toLowerCase().includes('property') ||
    table.section_name.toLowerCase().includes('plant') ||
    table.section_name.toLowerCase().includes('equipment') ||
    table.section_name.toLowerCase().includes('long-lived')
  );
  
  const longLivedAssetsFound = structuredEvidence.structuredItems.some(item =>
    item.sourceRef.toLowerCase().includes('long-lived') ||
    item.sourceRef.toLowerCase().includes('pp&e')
  );
  
  return {
    ppeTableDetected: !!ppeTable,
    ppeTableId: ppeTable?.table_id,
    longLivedAssetsFound,
    itemCount: structuredEvidence.structuredItems.length
  };
}

/**
 * PRIORITY 3: Main validation function
 * Validates evidence bundle for quality and channel isolation
 */
export function validateEvidenceBundle(
  bundle: EvidenceBundle,
  channel: Channel
): ValidationReport {
  
  const warnings: ValidationWarning[] = [];
  
  // 1. Validate channel isolation
  warnings.push(...validateChannelIsolation(bundle, channel));
  
  // 2. Validate entity kinds per channel
  warnings.push(...validateEntityKinds(bundle, channel));
  
  // 3. Validate source references
  warnings.push(...validateSourceReferences(bundle, channel));
  
  // 4. Validate data completeness
  warnings.push(...validateCompleteness(bundle, channel));
  
  // 5. Validate confidence scores
  warnings.push(...validateConfidence(bundle, channel));
  
  // Determine if valid (no critical warnings)
  const hasCriticalWarnings = warnings.some(w => w.severity === 'critical');
  
  return {
    isValid: !hasCriticalWarnings,
    warnings,
    timestamp: new Date().toISOString(),
    channel
  };
}

/**
 * PRIORITY 3: Validate channel isolation
 * Detects cross-channel contamination in source references
 */
function validateChannelIsolation(
  bundle: EvidenceBundle,
  channel: Channel
): ValidationWarning[] {
  
  const warnings: ValidationWarning[] = [];
  
  // Check for cross-channel contamination in source references
  const otherChannels = [Channel.REVENUE, Channel.ASSETS, Channel.SUPPLY, Channel.FINANCIAL]
    .filter(c => c !== channel);
  
  for (const item of bundle.structuredItems) {
    for (const otherChannel of otherChannels) {
      const sourceRefLower = item.sourceRef?.toLowerCase() || '';
      const channelLower = otherChannel.toLowerCase();
      
      // Check for explicit channel name mentions
      if (sourceRefLower.includes(channelLower)) {
        warnings.push({
          severity: 'critical',
          category: 'contamination',
          message: `${channel} channel has structured item with ${otherChannel} source reference`,
          channel,
          details: {
            item: item.canonicalLabel,
            sourceRef: item.sourceRef,
            contaminatingChannel: otherChannel
          }
        });
      }
      
      // Check for channel-specific keywords
      const channelKeywords: Record<string, string[]> = {
        [Channel.REVENUE]: ['revenue', 'sales', 'net sales'],
        [Channel.ASSETS]: ['pp&e', 'property', 'plant', 'equipment', 'long-lived asset'],
        [Channel.SUPPLY]: ['supply chain', 'manufacturing', 'production'],
        [Channel.FINANCIAL]: ['currency', 'financial exposure', 'foreign exchange']
      };
      
      const otherKeywords = channelKeywords[otherChannel] || [];
      for (const keyword of otherKeywords) {
        if (sourceRefLower.includes(keyword) && channel !== otherChannel) {
          warnings.push({
            severity: 'critical',
            category: 'contamination',
            message: `${channel} channel has item with ${otherChannel}-specific keyword "${keyword}" in source reference`,
            channel,
            details: {
              item: item.canonicalLabel,
              sourceRef: item.sourceRef,
              keyword,
              contaminatingChannel: otherChannel
            }
          });
        }
      }
    }
  }
  
  return warnings;
}

/**
 * PRIORITY 3: Validate entity kinds per channel
 * Ensures each channel has appropriate entity types
 */
function validateEntityKinds(
  bundle: EvidenceBundle,
  channel: Channel
): ValidationWarning[] {
  
  const warnings: ValidationWarning[] = [];
  
  // Define expected entity kinds per channel
  const expectedEntityKinds: Record<Channel, EntityKind[]> = {
    [Channel.REVENUE]: [EntityKind.GEO_LABEL, EntityKind.COUNTRY, EntityKind.NONSTANDARD_LABEL],
    [Channel.ASSETS]: [EntityKind.COUNTRY, EntityKind.NONSTANDARD_LABEL, EntityKind.GEO_LABEL],
    [Channel.SUPPLY]: [], // Empty structured items expected
    [Channel.FINANCIAL]: [EntityKind.CURRENCY_LABEL] // Or empty
  };
  
  const expected = expectedEntityKinds[channel];
  
  for (const item of bundle.structuredItems) {
    if (!expected.includes(item.entityKind)) {
      warnings.push({
        severity: 'high',
        category: 'entity_kind',
        message: `${channel} channel has unexpected entity kind: ${item.entityKind}`,
        channel,
        details: {
          item: item.canonicalLabel,
          entityKind: item.entityKind,
          expectedKinds: expected.map(k => k.toString())
        }
      });
    }
  }
  
  // Special check for Supply channel (should be empty)
  if (channel === Channel.SUPPLY && bundle.structuredItems.length > 0) {
    warnings.push({
      severity: 'critical',
      category: 'contamination',
      message: `Supply channel should have empty structured items, but has ${bundle.structuredItems.length} items`,
      channel,
      details: {
        itemCount: bundle.structuredItems.length,
        items: bundle.structuredItems.map(i => i.canonicalLabel)
      }
    });
  }
  
  return warnings;
}

/**
 * PRIORITY 3: Validate source references
 * Ensures source references match expected patterns for each channel
 */
function validateSourceReferences(
  bundle: EvidenceBundle,
  channel: Channel
): ValidationWarning[] {
  
  const warnings: ValidationWarning[] = [];
  
  // Define expected source patterns per channel
  const expectedSourcePatterns: Record<Channel, RegExp[]> = {
    [Channel.REVENUE]: [/revenue/i, /geographic.*segment/i, /sales.*region/i, /net.*sales/i],
    [Channel.ASSETS]: [/pp&e/i, /property.*plant.*equipment/i, /long.*lived.*asset/i, /asset.*geography/i],
    [Channel.SUPPLY]: [/supply.*chain/i, /manufacturing/i, /production/i, /narrative/i],
    [Channel.FINANCIAL]: [/currency/i, /financial.*exposure/i, /foreign.*exchange/i, /financial.*geography/i]
  };
  
  const expected = expectedSourcePatterns[channel];
  
  for (const item of bundle.structuredItems) {
    const sourceRef = item.sourceRef?.toLowerCase() || '';
    const matchesExpected = expected.some(pattern => pattern.test(sourceRef));
    
    if (!matchesExpected && sourceRef.length > 0 && sourceRef !== 'legacy exposure data') {
      warnings.push({
        severity: 'medium',
        category: 'source_ref',
        message: `${channel} channel has item with unexpected source reference pattern`,
        channel,
        details: {
          item: item.canonicalLabel,
          sourceRef: item.sourceRef,
          expectedPatterns: expected.map(p => p.source)
        }
      });
    }
  }
  
  return warnings;
}

/**
 * PRIORITY 3: Validate data completeness
 * Checks for missing or incomplete data
 */
function validateCompleteness(
  bundle: EvidenceBundle,
  channel: Channel
): ValidationWarning[] {
  
  const warnings: ValidationWarning[] = [];
  
  // Revenue should have segment labels (not just countries)
  if (channel === Channel.REVENUE) {
    const hasSegmentLabels = bundle.structuredItems.some(
      item => item.entityKind === EntityKind.GEO_LABEL
    );
    
    const hasCountries = bundle.structuredItems.some(
      item => item.entityKind === EntityKind.COUNTRY
    );
    
    if (!hasSegmentLabels && hasCountries && bundle.structuredItems.length > 0) {
      warnings.push({
        severity: 'high',
        category: 'completeness',
        message: 'Revenue channel has no segment labels (GEO_LABEL), only countries - possible premature conversion',
        channel,
        details: {
          itemCount: bundle.structuredItems.length,
          entityKinds: bundle.structuredItems.map(i => i.entityKind.toString()),
          items: bundle.structuredItems.map(i => i.canonicalLabel)
        }
      });
    }
  }
  
  // Assets should have data (not empty)
  if (channel === Channel.ASSETS && bundle.structuredItems.length === 0) {
    warnings.push({
      severity: 'medium',
      category: 'completeness',
      message: 'Assets channel has no structured items (expected PP&E table)',
      channel,
      details: {}
    });
  }
  
  // Check for total row
  const hasTotalRow = bundle.structuredItems.some(item => item.isTotalRow);
  if (bundle.structuredItems.length > 0 && !hasTotalRow) {
    warnings.push({
      severity: 'low',
      category: 'completeness',
      message: `${channel} channel has no total row for normalization verification`,
      channel,
      details: {
        itemCount: bundle.structuredItems.length
      }
    });
  }
  
  // Check for zero values
  const zeroValueItems = bundle.structuredItems.filter(item => item.value === 0);
  if (zeroValueItems.length > 0) {
    warnings.push({
      severity: 'low',
      category: 'completeness',
      message: `${channel} channel has ${zeroValueItems.length} items with zero values`,
      channel,
      details: {
        zeroValueItems: zeroValueItems.map(i => i.canonicalLabel)
      }
    });
  }
  
  return warnings;
}

/**
 * PRIORITY 3: Validate confidence scores
 * Checks narrative definition confidence levels
 */
function validateConfidence(
  bundle: EvidenceBundle,
  channel: Channel
): ValidationWarning[] {
  
  const warnings: ValidationWarning[] = [];
  
  // Check narrative definitions confidence
  if (bundle.narrative?.definitions) {
    for (const [label, def] of bundle.narrative.definitions.entries()) {
      if (def.confidence < 0.5) {
        warnings.push({
          severity: 'medium',
          category: 'confidence',
          message: `Low confidence (${def.confidence.toFixed(2)}) for definition of "${label}"`,
          channel,
          details: {
            label,
            confidence: def.confidence,
            includes: def.includes,
            excludes: def.excludes,
            residualOf: def.residualOf,
            sourceRef: def.sourceRef
          }
        });
      }
      
      // Check for definitions with no includes, excludes, or residual
      if (def.includes.length === 0 && def.excludes.length === 0 && !def.residualOf) {
        warnings.push({
          severity: 'medium',
          category: 'confidence',
          message: `Definition for "${label}" has no membership information`,
          channel,
          details: {
            label,
            confidence: def.confidence,
            sourceRef: def.sourceRef
          }
        });
      }
    }
  }
  
  return warnings;
}

/**
 * PRIORITY 3: Log validation report to console
 */
export function logValidationReport(report: ValidationReport): void {
  if (report.warnings.length === 0) {
    console.log(`[Evidence Validation] ✅ ${report.channel} channel passed all validation checks`);
    return;
  }
  
  console.warn(`[Evidence Validation] ⚠️ ${report.channel} channel has ${report.warnings.length} warnings:`);
  
  // Group warnings by severity
  const criticalWarnings = report.warnings.filter(w => w.severity === 'critical');
  const highWarnings = report.warnings.filter(w => w.severity === 'high');
  const mediumWarnings = report.warnings.filter(w => w.severity === 'medium');
  const lowWarnings = report.warnings.filter(w => w.severity === 'low');
  
  if (criticalWarnings.length > 0) {
    console.error(`  🔴 CRITICAL (${criticalWarnings.length}):`);
    criticalWarnings.forEach(w => {
      console.error(`    [${w.category}] ${w.message}`, w.details);
    });
  }
  
  if (highWarnings.length > 0) {
    console.warn(`  🟠 HIGH (${highWarnings.length}):`);
    highWarnings.forEach(w => {
      console.warn(`    [${w.category}] ${w.message}`, w.details);
    });
  }
  
  if (mediumWarnings.length > 0) {
    console.warn(`  🟡 MEDIUM (${mediumWarnings.length}):`);
    mediumWarnings.forEach(w => {
      console.warn(`    [${w.category}] ${w.message}`, w.details);
    });
  }
  
  if (lowWarnings.length > 0) {
    console.info(`  🔵 LOW (${lowWarnings.length}):`);
    lowWarnings.forEach(w => {
      console.info(`    [${w.category}] ${w.message}`, w.details);
    });
  }
  
  if (!report.isValid) {
    console.error(`[Evidence Validation] ❌ ${report.channel} channel FAILED validation (has critical warnings)`);
  }
}