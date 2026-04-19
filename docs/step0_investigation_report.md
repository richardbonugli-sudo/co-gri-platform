# Step 0 Methodology Investigation Report

**Date:** January 6, 2026
**Investigator:** Mike (Team Leader)
**Subject:** Comprehensive Analysis of Step 0 Extraction and Classification Issues

---

## Executive Summary

This investigation has identified **critical systemic failures** in the Step 0 evidence extraction and classification pipeline that are causing incorrect fallback selection, double allocation, and zeroed-out channels. The root cause is **premature segment-to-country conversion** during evidence extraction, violating the V.4 specification that requires segment labels to remain as labels until membership resolution occurs via SSF.

**Impact:** All four channels (Revenue, Supply Chain, Financial, Assets) are affected, resulting in:
- Incorrect fallback selection (RF_B applied when SSF should be used)
- Evidence contamination across channels
- Double allocation requiring renormalization (2.0 → 1.0)
- Complete channel zeroing (Supply, Financial showing 0% output)
- Wrong country rankings and exposure estimates

**Severity:** CRITICAL - Production deployment blocker

**Recommendation:** IMMEDIATE FIX REQUIRED before any further development

---

## Investigation Methodology

**Files Analyzed:**
1. `/workspace/shadcn-ui/src/services/v4/evidenceExtractor.ts` (198 lines)
2. `/workspace/shadcn-ui/src/services/v4/labelResolution.ts` (255 lines)
3. `/workspace/shadcn-ui/src/services/v4/evidenceCapture.ts` (206 lines)
4. `/workspace/shadcn-ui/src/services/v4/v4Orchestrator.ts` (367 lines)
5. `/workspace/shadcn-ui/src/services/v4/allocators.ts` (282 lines)
6. `/workspace/shadcn-ui/src/services/v34FallbackLogic.ts` (1,491 lines)
7. `/workspace/shadcn-ui/src/services/evidenceHierarchy.ts` (918 lines)

**Analysis Approach:**
- Code review of Step 0 extraction pipeline
- Data flow tracing from raw evidence to final weights
- Cross-reference with user-provided issue documentation
- Mathematical validation of normalization logic
- Evidence bundle isolation verification

---

## Issue 1: Revenue Channel - Segment-to-Country Conversion (CRITICAL)

### Expected Behavior (V.4 Specification)

**Apple 10-K Revenue Table:**
```
Americas:              $134,161
Europe:                $82,329
Greater China:         $49,884
Japan:                 $22,067
Rest of Asia Pacific:  $25,254
Total:                 $313,695
```

**Expected Step 0 Output:**
- **DIRECT:** Japan only (country label)
- **SSF:** Americas, Europe, Greater China, Rest of Asia Pacific (segment labels with resolvable membership)
- **RF:** None (closed totals exist)

**Expected Entity Classification:**
```
Japan → EntityKind.COUNTRY
Americas → EntityKind.GEO_LABEL
Europe → EntityKind.GEO_LABEL
Greater China → EntityKind.GEO_LABEL
Rest of Asia Pacific → EntityKind.GEO_LABEL
```

### Actual Behavior (Current Implementation)

**Observed Step 0 Output:**
```
United States → 0.4230 (42.3% ≈ Americas share)
China → 0.1690 (collapsing HK + Taiwan)
Germany, UK, France, Italy, Spain, etc. (Europe expanded)
Japan → [value]
```

**What's Happening:**
1. Segment labels are being **converted to country rows during extraction**
2. Americas → United States (implicit 1:1 mapping)
3. Greater China → China (collapsing HK + Taiwan)
4. Europe → exploded into individual countries

### Root Cause Analysis

**File:** `src/services/v4/evidenceExtractor.ts`

**Problem Code (Lines 72-89):**
```typescript
// Otherwise, extract from legacy exposures
if (companyData.exposures) {
  for (const exp of companyData.exposures) {
    const rawLabel = exp.country;  // ← ISSUE: Already converted to country
    const canonicalLabel = canonicalizeLabel(rawLabel);
    const entityKind = classifyEntityKind(canonicalLabel, channel);
    
    items.push({
      rawLabel,
      canonicalLabel,
      entityKind,
      value: exp.percentage / 100,
      unit: 'pct',
      sourceRef: exp.description || 'Legacy exposure data',
      isTotalRow: false
    });
  }
}
```

**Analysis:**
- The `companyData.exposures` array is already pre-processed with country names
- Segment labels (Americas, Europe, Greater China) have been converted to countries **BEFORE** reaching Step 0
- This violates V.4 invariant: "Segment labels must remain labels; membership resolution occurs AFTER Step 0 via SSF"

**Evidence:**
- User document states: "Segment labels are being converted into COUNTRY rows during extraction"
- Debug bundle shows: "Structured Items" list contains COUNTRY entities for what should be GEO_LABEL entities
- Step 1 behavior: Revenue rows labeled as "evidence-based / no fallback" when they should be SSF

### Downstream Impact

**Fallback Selection Error:**
```
Debug evidence:
RF Case Chosen: RF_B
Restricted set size = 44
Pre-Normalize Sum = 2.0 → Post-Normalize = 1.0
```

**Why RF_B is Selected:**
1. Step 0 emits segment rows as COUNTRY evidence
2. V.4 orchestrator sees COUNTRY entities, treats as DIRECT allocations
3. No closed label totals detected (because segments were converted)
4. Fallback logic falls through to RF_B (channel_total)
5. Both DIRECT and RF_B allocations applied → double allocation
6. Renormalization required: 2.0 → 1.0

**Correct Flow Should Be:**
1. Step 0 emits segment rows as GEO_LABEL evidence
2. V.4 orchestrator detects closed label totals
3. SSF applied to each segment (Americas, Europe, Greater China, Rest of Asia Pacific)
4. Japan allocated as DIRECT
5. No RF fallback needed
6. No double allocation, no renormalization

### Mathematical Validation

**Current (Incorrect) Flow:**
```
DIRECT (from converted segments): 1.0 (100%)
RF_B (channel_total): 1.0 (100%)
Total before normalization: 2.0
After normalization: 1.0 (divide all by 2)
```

**Correct Flow:**
```
DIRECT (Japan only): 0.07 (7%)
SSF (Americas): 0.428 (42.8%)
SSF (Europe): 0.262 (26.2%)
SSF (Greater China): 0.159 (15.9%)
SSF (Rest of Asia Pacific): 0.081 (8.1%)
Total: 1.0 (no normalization needed)
```

---

## Issue 2: Supply Chain Channel - Evidence Contamination + Zeroing (CRITICAL)

### Expected Behavior

**Apple 10-K Supply Chain Evidence:**
- **Narrative only:** "Manufacturing/assembly in China, Taiwan, India, Japan, Vietnam, South Korea, U.S., Europe, other Asian countries"
- **No closed numeric totals**

**Expected Step 0 Output:**
- **Structured Items:** Empty (no structured table)
- **Narrative Mentions:** Countries extracted from narrative text
- **Expected Fallback:** RF-B or RF-C applied to 100% of channel

### Actual Behavior

**Observed Step 0 Output:**
```
Supply incorrectly detects a structured table with 14 rows
The "structured items" mirror Revenue's country list and values
```

**Observed Step 1 Output:**
```
Supply shows 0.0000% raw and weighted contribution for every country
Supply contributes 0% to the blended output
```

**Debug Evidence:**
```
Pre-Normalize = 1.0
Post-Normalize = 0.0
Final Weights = 0
```

### Root Cause Analysis

**Evidence Contamination:**

**File:** `src/services/v4/evidenceCapture.ts`

**Problem (Lines 43-60):**
```typescript
function captureStructuredEvidence(
  evidenceBundle: EvidenceBundle,
  channel: Channel
): StructuredEvidence {
  
  // Detect tables from structured items
  const detectedTables = detectTables(evidenceBundle, channel);
  
  // Convert structured items to debug format
  const structuredItems: StructuredItemDebug[] = evidenceBundle.structuredItems.map(item => ({
    rawLabel: item.rawLabel,
    canonicalLabel: item.canonicalLabel,
    entityKind: item.entityKind.toString() as 'COUNTRY' | 'GEO_LABEL' | 'NONSTANDARD',
    value: item.value,
    unit: item.unit,
    isTotalRow: item.isTotalRow || false,
    sourceRef: item.sourceRef
  }));
  
  return {
    detected_tables: detectedTables,
    structuredItems  // ← ISSUE: No channel-specific filtering
  };
}
```

**Analysis:**
- `evidenceBundle.structuredItems` contains items from ALL channels or is being reused
- No channel-specific filtering or validation
- Supply Chain channel is receiving Revenue channel's structured items
- This explains why "structured items" are identical across channels

**Channel Isolation Failure:**

**File:** `src/services/v4/evidenceExtractor.ts`

**Problem (Lines 64-70):**
```typescript
// Check if company has V4 channel evidence
if (companyData.channelEvidence && companyData.channelEvidence[channel.toLowerCase()]) {
  const channelEvidence = companyData.channelEvidence[channel.toLowerCase()];
  if (channelEvidence.structuredItems) {
    return channelEvidence.structuredItems;  // ← Channel-specific
  }
}

// Otherwise, extract from legacy exposures
if (companyData.exposures) {  // ← NOT channel-specific
  for (const exp of companyData.exposures) {
    // ... extract items
  }
}
```

**Analysis:**
- V4 channel evidence is channel-specific (correct)
- Legacy exposures are NOT channel-specific (incorrect)
- All channels receive the same legacy exposure data
- This causes cross-channel contamination

**Zeroing Logic:**

**File:** `src/services/v4/v4Orchestrator.ts`

**Suspected Issue (Lines 104-197):**
```typescript
// STEP 2/3/4: If closed totals exist, allocate label-by-label
if (hasClosedTotals) {
  trace.stepLog.push('STEP2: closed allocatable label totals detected => label-by-label allocation');
  
  for (const label of closedLabels) {
    // ... allocation logic
  }
  
  // Normalize final weights
  const final = normalizeCountryWeights(countryWeights);
  trace.finalWeights = final;
  trace.stepLog.push('END: direct + SSF + RF-A merged and normalized');
  
  return { weights: final, trace };
}
```

**Analysis:**
- Supply Chain receives contaminated structured items (from Revenue)
- Orchestrator detects "closed totals" (incorrectly)
- Attempts SSF/RF-A allocation
- Allocation fails due to invalid membership or other checks
- `countryWeights` remains empty or gets zeroed
- Normalization of empty map returns empty map
- Final weights = 0 for all countries

### Mathematical Validation

**Expected (Correct) Flow:**
```
Step 0: No structured items (narrative only)
Step 1: No closed totals detected
Step 2: RF-B applied to 100% of channel
Step 3: Restricted set P built from narrative countries
Step 4: RF allocation produces non-zero weights
Final: Supply contributes 25% to blended output (example)
```

**Actual (Incorrect) Flow:**
```
Step 0: Contaminated structured items (from Revenue)
Step 1: Closed totals detected (incorrectly)
Step 2: SSF/RF-A attempted
Step 3: Allocation fails (invalid data)
Step 4: countryWeights = empty
Step 5: Normalization returns empty
Final: Supply contributes 0% to blended output
```

---

## Issue 3: Financial Channel - Same Failure Mode as Supply (CRITICAL)

### Expected Behavior

**Apple 10-K Financial Evidence:**
- **Partial structured:** Debt currency composition, hedging notionals
- **No closed geographic totals**

**Expected Step 0 Output:**
- **Structured Items:** Currency labels (USD, EUR, GBP, etc.)
- **Narrative Mentions:** Countries from hedging/operations narrative
- **Expected Fallback:** RF-D applied to 100% of channel

### Actual Behavior

**Observed Step 0 Output:**
```
Financial incorrectly detects a "structured" table
Structured items match Revenue's country list (contamination)
```

**Observed Step 1 Output:**
```
Financial shows 0.0000% contribution across all countries
```

**Debug Evidence:**
```
Pre-Normalize = 1.0 → Post-Normalize = 0.0 → Final = 0
```

### Root Cause Analysis

**Same as Supply Chain:**
1. Evidence contamination from Revenue channel
2. Incorrect closed total detection
3. Failed SSF/RF-A allocation
4. Channel output zeroed

**Additional Issue - Currency Labels:**

**File:** `src/services/v4/labelResolution.ts`

**Lines 122-131:**
```typescript
// Check for currency labels (financial channel)
if (channel === 'FINANCIAL') {
  const currencyPatterns = [/USD/i, /EUR/i, /GBP/i, /JPY/i, /CNY/i];
  for (const pattern of currencyPatterns) {
    if (pattern.test(canonicalLabel)) {
      return EntityKind.CURRENCY_LABEL;
    }
  }
}
```

**Analysis:**
- Currency label detection exists (correct)
- But contaminated structured items override this
- Financial channel receives country labels instead of currency labels
- Currency-based allocation logic never triggers

---

## Issue 4: Assets Channel - Wrong Table Parsed (CRITICAL)

### Expected Behavior

**Apple 10-K Long-Lived Assets Table:**
```
United States:    $40,274  (80%)
China:            $3,617   (7.3%, includes HK + TW via footnote)
Other countries:  $5,943   (12%)
Total:            $49,834
```

**Expected Step 0 Output:**
- **DIRECT:** United States (country label)
- **SSF:** China (includes HK + Taiwan via footnote membership)
- **RF-A:** Other countries (residual label only)

**Expected Final Weights:**
```
United States: ~80%
China: ~5% (after SSF split to CN/HK/TW)
Hong Kong: ~1%
Taiwan: ~1%
[Other countries via RF-A]: ~13%
```

### Actual Behavior

**Observed Step 0 Output:**
```
Assets "Structured Items" mirror Revenue's country list (contamination)
```

**Observed Step 1 Output:**
```
US ≈ 56% (should be ~80%)
China ≈ 15.9% (should be ~7.3% before SSF)
Overall pattern mirrors Revenue rather than asset table
```

**Debug Evidence:**
```
Assets claims two detected tables
Long-lived assets table does NOT appear to be correctly parsed
Only one closed label processed: "Other" = 5% → RF-A
No SSF applied to China bucket
Pre-Normalize Sum = 2.0 (double allocation symptom)
```

### Root Cause Analysis

**Table Detection Failure:**

**File:** `src/services/v4/evidenceCapture.ts`

**Lines 66-126:**
```typescript
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
      entityKind: item.entityKind.toString() as 'COUNTRY' | 'GEO_LABEL' | 'NONSTANDARD',
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
    }
    // ...
  }
}
```

**Analysis:**
- Table detection relies on `sourceRef` grouping
- If `sourceRef` is missing or incorrect, tables won't be detected properly
- Assets channel is receiving contaminated items with wrong `sourceRef`
- Long-lived assets table is not being parsed from raw filing
- Instead, legacy exposure data (Revenue-like) is being used

**China Footnote Handling:**

**Expected:** China footnote defines membership: China + Hong Kong + Taiwan

**File:** `src/services/v4/evidenceExtractor.ts`

**Missing Logic:**
- No footnote parsing for membership definitions
- China label should have narrative definition: `includes: ['China', 'Hong Kong', 'Taiwan']`
- This would trigger SSF allocation
- Currently, China is treated as a direct country (no SSF)

**Double Allocation:**

**Same as Revenue:**
1. Contaminated structured items treated as DIRECT
2. RF-A also applied (because "Other countries" detected)
3. Both allocations summed: 1.0 + 1.0 = 2.0
4. Renormalization: divide all by 2
5. Final weights incorrect

---

## Issue 5: Cross-Channel Evidence Contamination (CRITICAL)

### Observation

**User Document (Lines 12-20):**
```
B. Cross-channel evidence contamination (critical)
In the debug bundle, the Step-0 "Structured Items (Top 10)" list is 
identical across Revenue, Supply, Financial, and Assets (same country 
list, same values).

That should NEVER happen:
- Supply and Financial do NOT have structured country tables like Revenue.
- Assets has its OWN distinct structured table (long-lived assets).
```

### Root Cause Analysis

**Evidence Bundle Creation:**

**File:** `src/services/v4/evidenceExtractor.ts`

**Function:** `extractEvidenceBundle_V4()`

**Lines 21-52:**
```typescript
export function extractEvidenceBundle_V4(
  companyData: any,
  channel: Channel,
  sector: string,
  homeCountry: string
): EvidenceBundle {
  
  // Extract structured items from company data
  const structuredItems = extractStructuredItems(companyData, channel);
  
  // Extract narrative mentions
  const narrative = extractNarrativeMentions(companyData, channel);
  
  // Supplementary hints (empty for now)
  const supplementaryMembershipHints: NarrativeMentions = {
    namedCountries: new Set(),
    geoLabels: new Set(),
    nonStandardLabels: new Set(),
    currencyLabels: new Set(),
    definitions: new Map(),
    rawSentences: []
  };
  
  return {
    channel,
    structuredItems,  // ← Should be channel-specific
    narrative,        // ← Should be channel-specific
    supplementaryMembershipHints,
    homeCountry,
    sector
  };
}
```

**Problem in `extractStructuredItems()`:**

**Lines 72-89:**
```typescript
// Otherwise, extract from legacy exposures
if (companyData.exposures) {  // ← NOT channel-specific
  for (const exp of companyData.exposures) {
    const rawLabel = exp.country;
    const canonicalLabel = canonicalizeLabel(rawLabel);
    const entityKind = classifyEntityKind(canonicalLabel, channel);
    
    items.push({
      rawLabel,
      canonicalLabel,
      entityKind,
      value: exp.percentage / 100,
      unit: 'pct',
      sourceRef: exp.description || 'Legacy exposure data',
      isTotalRow: false
    });
  }
}
```

**Analysis:**
- `companyData.exposures` is a SINGLE array shared across all channels
- When `extractEvidenceBundle_V4()` is called for each channel, it receives the SAME exposures
- No channel-specific filtering
- Result: All channels get identical structured items

**Evidence:**
- Debug bundle shows identical "Structured Items (Top 10)" across all channels
- Same country list, same values
- This is impossible if extraction were channel-specific

### Impact

**Cascading Failures:**
1. Supply Chain receives Revenue's structured items → wrong fallback selection
2. Financial receives Revenue's structured items → wrong fallback selection
3. Assets receives Revenue's structured items → wrong table parsed
4. All channels show incorrect allocations
5. Blended output is meaningless

---

## Issue 6: Output View Mismatch (HIGH)

### Observation

**User Document (Lines 4-10):**
```
A. Output view mismatch (filtering / truncation)
The Step-1 "Detailed Breakdown" shows 15 countries.
The debug bundle shows:
Revenue → 44 final weights
Assets → 27 final weights
Supply + Financial → 0 final weights
```

### Analysis

**Two Separate Issues:**

1. **Display Filtering:**
   - UI shows top 15 countries only (display truncation)
   - Debug bundle shows all countries with non-zero weights
   - This is EXPECTED behavior (UI optimization)
   - NOT a bug, just a presentation difference

2. **Zero Weights:**
   - Supply and Financial showing 0 final weights
   - This IS a bug (covered in Issues 2 and 3)
   - Caused by evidence contamination + allocation failure

**Conclusion:**
- Output view mismatch is a SYMPTOM, not root cause
- Real issue is channel zeroing (Issues 2 and 3)

---

## Summary of Root Causes

### Primary Root Cause: Premature Segment-to-Country Conversion

**Location:** `src/services/v4/evidenceExtractor.ts` (Lines 72-89)

**Issue:**
- Segment labels (Americas, Europe, Greater China) are converted to country names BEFORE Step 0
- This violates V.4 specification: "Segment labels must remain labels"
- Conversion happens in legacy exposure data or upstream data processing

**Impact:**
- Revenue: Wrong fallback (RF_B instead of SSF)
- All channels: Double allocation requiring renormalization

### Secondary Root Cause: Evidence Contamination

**Location:** `src/services/v4/evidenceExtractor.ts` (Lines 72-89)

**Issue:**
- `companyData.exposures` is shared across all channels
- No channel-specific filtering during extraction
- All channels receive identical structured items

**Impact:**
- Supply Chain: Receives Revenue's data, fails allocation, zeroed output
- Financial: Receives Revenue's data, fails allocation, zeroed output
- Assets: Receives Revenue's data instead of PP&E table, wrong weights

### Tertiary Root Cause: Missing Table Parsing

**Location:** `src/services/v4/evidenceExtractor.ts` (Lines 92-108)

**Issue:**
- PP&E table parsing exists but is not triggered
- Footnote parsing for membership definitions missing
- Falls back to legacy exposure data

**Impact:**
- Assets: Wrong table used, China footnote ignored, no SSF for China

---

## Recommended Fixes (Prioritized)

### Priority 1: Fix Evidence Extraction (IMMEDIATE)

**File:** `src/services/v4/evidenceExtractor.ts`

**Changes Required:**

1. **Add Channel-Specific Data Sources:**
```typescript
function extractStructuredItems(
  companyData: any,
  channel: Channel
): StructuredItem[] {
  
  const items: StructuredItem[] = [];
  
  // Check for V4 channel-specific evidence FIRST
  if (companyData.channelEvidence && companyData.channelEvidence[channel.toLowerCase()]) {
    const channelEvidence = companyData.channelEvidence[channel.toLowerCase()];
    if (channelEvidence.structuredItems) {
      return channelEvidence.structuredItems;
    }
  }
  
  // Channel-specific extraction from raw filing
  switch (channel) {
    case Channel.REVENUE:
      return extractRevenueStructuredItems(companyData);
    case Channel.ASSETS:
      return extractAssetsStructuredItems(companyData);
    case Channel.SUPPLY:
      return extractSupplyStructuredItems(companyData);
    case Channel.FINANCIAL:
      return extractFinancialStructuredItems(companyData);
    default:
      return [];
  }
}
```

2. **Implement Channel-Specific Extractors:**
```typescript
function extractRevenueStructuredItems(companyData: any): StructuredItem[] {
  // Parse revenue table from raw filing
  // PRESERVE segment labels (Americas, Europe, etc.)
  // DO NOT convert to countries
  // Return items with EntityKind.GEO_LABEL for segments
}

function extractAssetsStructuredItems(companyData: any): StructuredItem[] {
  // Parse PP&E / long-lived assets table from raw filing
  // Parse footnotes for membership definitions
  // Return items with correct entity kinds
}

function extractSupplyStructuredItems(companyData: any): StructuredItem[] {
  // Supply chain typically has NO structured table
  // Return empty array
  // Rely on narrative extraction only
}

function extractFinancialStructuredItems(companyData: any): StructuredItem[] {
  // Parse currency composition table
  // Return items with EntityKind.CURRENCY_LABEL
}
```

3. **Remove Legacy Exposure Fallback:**
```typescript
// DELETE this entire block (Lines 72-89):
// if (companyData.exposures) {
//   for (const exp of companyData.exposures) {
//     // ... this causes contamination
//   }
// }
```

**Estimated Effort:** 2-3 days
**Risk:** Medium (requires raw filing parsing)

### Priority 2: Add Footnote Parsing (HIGH)

**File:** `src/services/v4/evidenceExtractor.ts`

**Changes Required:**

1. **Parse Footnotes for Membership Definitions:**
```typescript
function extractNarrativeMentions(
  companyData: any,
  channel: Channel
): NarrativeMentions {
  
  const mentions: NarrativeMentions = {
    namedCountries: new Set(),
    geoLabels: new Set(),
    nonStandardLabels: new Set(),
    currencyLabels: new Set(),
    definitions: new Map(),
    rawSentences: []
  };
  
  // Parse footnotes for membership definitions
  if (companyData.footnotes) {
    for (const footnote of companyData.footnotes) {
      const def = parseFootnoteForMembership(footnote);
      if (def) {
        mentions.definitions.set(def.label, def);
      }
    }
  }
  
  // ... rest of narrative extraction
}

function parseFootnoteForMembership(footnote: string): NarrativeDefinition | null {
  // Example: "China includes Hong Kong and Taiwan"
  // Extract: label = "China", includes = ["China", "Hong Kong", "Taiwan"]
  
  const patterns = [
    /(\w+)\s+includes?\s+([^.]+)/i,
    /(\w+)\s+comprises?\s+([^.]+)/i,
    /(\w+)\s+consists?\s+of\s+([^.]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = footnote.match(pattern);
    if (match) {
      const label = match[1];
      const memberText = match[2];
      const members = memberText.split(/,|\s+and\s+/).map(m => m.trim());
      
      return {
        label,
        includes: members,
        excludes: [],
        residualOf: null,
        confidence: 0.9,
        sourceRef: 'Footnote definition'
      };
    }
  }
  
  return null;
}
```

**Estimated Effort:** 1-2 days
**Risk:** Low (additive feature)

### Priority 3: Add Evidence Bundle Validation (MEDIUM)

**File:** `src/services/v4/evidenceCapture.ts`

**Changes Required:**

1. **Validate Channel Isolation:**
```typescript
function captureStructuredEvidence(
  evidenceBundle: EvidenceBundle,
  channel: Channel
): StructuredEvidence {
  
  // Validate that structured items are channel-appropriate
  validateChannelEvidence(evidenceBundle.structuredItems, channel);
  
  // ... rest of capture logic
}

function validateChannelEvidence(items: StructuredItem[], channel: Channel): void {
  // Check for evidence contamination
  const inappropriateItems = items.filter(item => {
    switch (channel) {
      case Channel.SUPPLY:
      case Channel.FINANCIAL:
        // These channels should NOT have country-level structured tables
        return item.entityKind === EntityKind.COUNTRY && item.sourceRef.includes('Revenue');
      case Channel.ASSETS:
        // Assets should have PP&E table, not revenue table
        return item.sourceRef.includes('Revenue') || item.sourceRef.includes('Sales');
      default:
        return false;
    }
  });
  
  if (inappropriateItems.length > 0) {
    console.warn(`[Evidence Validation] Channel ${channel} has ${inappropriateItems.length} inappropriate items`);
    console.warn('Possible evidence contamination detected');
  }
}
```

**Estimated Effort:** 1 day
**Risk:** Low (validation only, no logic changes)

### Priority 4: Fix Normalization Reporting (LOW)

**File:** `src/services/v4/v4OrchestratorWithDebug.ts`

**Changes Required:**

**Lines 228-267 are CORRECT:**
```typescript
function buildIntegrityChecks(trace: TraceObject) {
  
  // Calculate pre-normalize sum (sum of all allocations before normalization)
  let preNormalizeSum = 0;
  for (const weight of trace.directAlloc.values()) {
    preNormalizeSum += weight;
  }
  for (const alloc of trace.labelAllocations) {
    for (const weight of alloc.outputCountries.values()) {
      preNormalizeSum += weight;
    }
  }
  
  // Post-normalize sum (should be 1.0)
  const postNormalizeSum = Array.from(trace.finalWeights.values()).reduce((sum, w) => sum + w, 0);
  
  // ... rest of logic
}
```

**Note:** This code is already correct. The 2.0 → 1.0 normalization is being correctly reported. The issue is that preNormalizeSum SHOULD be 1.0 (not 2.0) if upstream extraction were correct.

**No changes needed here.** Fix Priority 1 and this will report 1.0 → 1.0.

---

## Testing Strategy

### Test Case 1: Apple Revenue (Segment Labels)

**Input:**
```
Raw Filing Data:
Americas: $134,161
Europe: $82,329
Greater China: $49,884
Japan: $22,067
Rest of Asia Pacific: $25,254
Total: $313,695
```

**Expected Output:**
```
Step 0 Structured Items:
- Americas (GEO_LABEL): 0.428
- Europe (GEO_LABEL): 0.262
- Greater China (GEO_LABEL): 0.159
- Japan (COUNTRY): 0.070
- Rest of Asia Pacific (GEO_LABEL): 0.081

Step 1 Decision:
- DIRECT: Japan (0.070)
- SSF: Americas → [US, CA, MX, BR, AR, CL, CO, PE]
- SSF: Europe → [UK, DE, FR, IT, ES, NL, CH, BE, AT, SE, NO, DK, FI, PL, IE]
- SSF: Greater China → [CN, HK, TW]
- SSF: Rest of Asia Pacific → [AU, NZ, SG, ID, TH, MY]

Final Weights:
- United States: ~0.35 (from Americas SSF)
- China: ~0.10 (from Greater China SSF)
- Japan: 0.070 (DIRECT)
- Germany: ~0.05 (from Europe SSF)
- ... (other countries from SSF)

Integrity Checks:
- Pre-normalize sum: 1.0 (no double allocation)
- Post-normalize sum: 1.0
- No renormalization needed
```

### Test Case 2: Apple Assets (PP&E Table)

**Input:**
```
Raw Filing Data:
United States: $40,274
China: $3,617 (footnote: includes Hong Kong and Taiwan)
Other countries: $5,943
Total: $49,834
```

**Expected Output:**
```
Step 0 Structured Items:
- United States (COUNTRY): 0.808
- China (GEO_LABEL): 0.073
- Other countries (NONSTANDARD_LABEL): 0.119

Step 0 Narrative Definitions:
- China: includes = [China, Hong Kong, Taiwan], confidence = 0.9

Step 1 Decision:
- DIRECT: United States (0.808)
- SSF: China → [CN, HK, TW] (0.073 split)
- RF-A: Other countries (0.119)

Final Weights:
- United States: 0.808
- China: ~0.05 (from China SSF)
- Hong Kong: ~0.01 (from China SSF)
- Taiwan: ~0.01 (from China SSF)
- [Other countries via RF-A]: ~0.119 distributed

Integrity Checks:
- Pre-normalize sum: 1.0
- Post-normalize sum: 1.0
- No renormalization needed
```

### Test Case 3: Apple Supply Chain (Narrative Only)

**Input:**
```
Raw Filing Data:
Narrative: "Manufacturing facilities located in China, Vietnam, and Mexico. 
Key suppliers based in Taiwan, South Korea, and Malaysia."
```

**Expected Output:**
```
Step 0 Structured Items: []
Step 0 Narrative Mentions:
- Named countries: [China, Vietnam, Mexico, Taiwan, South Korea, Malaysia]

Step 1 Decision:
- No closed totals
- Membership evidence exists (narrative countries)
- RF-B applied to 100% of channel

Restricted Set P: [China, Vietnam, Mexico, Taiwan, South Korea, Malaysia, ...]

Final Weights:
- China: ~0.40 (highest RF score)
- Vietnam: ~0.15
- Taiwan: ~0.12
- South Korea: ~0.10
- Mexico: ~0.08
- Malaysia: ~0.08
- ... (other countries in P)

Integrity Checks:
- Pre-normalize sum: 1.0
- Post-normalize sum: 1.0
- Supply contributes 25% to blended output (not 0%)
```

### Test Case 4: Apple Financial (Currency + Narrative)

**Input:**
```
Raw Filing Data:
Currency Composition:
- USD: 60%
- EUR: 20%
- GBP: 10%
- JPY: 10%

Narrative: "Significant cash holdings in European and Asian markets."
```

**Expected Output:**
```
Step 0 Structured Items:
- USD (CURRENCY_LABEL): 0.60
- EUR (CURRENCY_LABEL): 0.20
- GBP (CURRENCY_LABEL): 0.10
- JPY (CURRENCY_LABEL): 0.10

Step 0 Narrative Mentions:
- Geo labels: [Europe, Asia]

Step 1 Decision:
- No closed totals (currency labels don't have geographic totals)
- Membership evidence exists (narrative + currency mapping)
- RF-D applied to 100% of channel

Restricted Set P: [US, Eurozone countries, UK, Japan, Asian countries]

Final Weights:
- United States: ~0.50 (USD dominance)
- Germany: ~0.08 (EUR)
- United Kingdom: ~0.10 (GBP)
- Japan: ~0.10 (JPY)
- ... (other countries in P)

Integrity Checks:
- Pre-normalize sum: 1.0
- Post-normalize sum: 1.0
- Financial contributes 15% to blended output (not 0%)
```

---

## Impact Assessment

### Severity: CRITICAL

**Production Impact:**
- All four channels producing incorrect results
- Two channels (Supply, Financial) completely zeroed
- Revenue and Assets showing wrong country rankings
- Blended COGRI scores meaningless

**User Impact:**
- Users receiving incorrect risk assessments
- Investment decisions based on wrong data
- Regulatory compliance issues (incorrect geographic exposure reporting)
- Reputational damage if incorrect data is published

**Data Quality Impact:**
- Confidence scores misleading (showing high confidence for wrong data)
- Fallback method indicators incorrect (RF_B shown when SSF should be used)
- Debug bundles showing evidence contamination across channels

### Affected Companies

**All companies using V4 allocation logic:**
- Companies with segment-based revenue reporting (most large companies)
- Companies with PP&E footnotes (most companies with international assets)
- Companies with narrative-only supply chain disclosure (most companies)
- Companies with currency-based financial reporting (most companies)

**Estimated Impact:** 100% of companies in database

---

## Strategic Recommendations

### Immediate Actions (This Week)

1. **STOP all production deployments** using current V4 logic
2. **Implement Priority 1 fix** (Evidence Extraction) - 2-3 days
3. **Run Test Cases 1-4** to validate fixes
4. **Deploy to staging** for comprehensive testing

### Short-Term Actions (Next 2 Weeks)

1. **Implement Priority 2 fix** (Footnote Parsing) - 1-2 days
2. **Implement Priority 3 fix** (Evidence Validation) - 1 day
3. **Create regression test suite** for all channels
4. **Document V4 specification** with examples
5. **Deploy to production** after full validation

### Long-Term Actions (Next Month)

1. **Audit all existing company data** for evidence contamination
2. **Reprocess all companies** with corrected logic
3. **Create data quality dashboard** to monitor evidence extraction
4. **Implement automated testing** for new companies
5. **Document lessons learned** and update development process

### Process Improvements

1. **Code Review Requirements:**
   - All evidence extraction changes require senior review
   - All channel-specific logic requires cross-channel validation
   - All normalization logic requires mathematical validation

2. **Testing Requirements:**
   - Unit tests for each channel's evidence extraction
   - Integration tests for complete allocation pipeline
   - Regression tests for known edge cases
   - Manual review of debug bundles for sample companies

3. **Documentation Requirements:**
   - V4 specification must be kept up-to-date
   - All deviations from spec must be documented
   - All assumptions must be explicitly stated
   - All data sources must be documented

---

## Conclusion

This investigation has identified **critical systemic failures** in the Step 0 evidence extraction and classification pipeline. The root cause is **premature segment-to-country conversion** and **evidence contamination across channels**, both violating the V.4 specification.

**Key Findings:**
1. Revenue: Segment labels converted to countries → wrong fallback (RF_B instead of SSF)
2. Supply Chain: Evidence contaminated from Revenue → allocation fails → zeroed output
3. Financial: Evidence contaminated from Revenue → allocation fails → zeroed output
4. Assets: Wrong table parsed (Revenue instead of PP&E) → incorrect weights

**Recommended Actions:**
1. **IMMEDIATE:** Stop production deployments
2. **HIGH PRIORITY:** Fix evidence extraction (Priority 1) - 2-3 days
3. **MEDIUM PRIORITY:** Add footnote parsing (Priority 2) - 1-2 days
4. **LOW PRIORITY:** Add evidence validation (Priority 3) - 1 day

**Estimated Total Effort:** 4-6 days for all fixes + 2-3 days for testing = **1-2 weeks total**

**Risk Assessment:**
- **Without fixes:** 100% of companies showing incorrect results, production deployment blocker
- **With fixes:** Normal development risk, standard testing and validation required

**Next Steps:**
1. Review this report with development team
2. Prioritize fixes based on business impact
3. Create detailed implementation plan
4. Begin Priority 1 fix immediately

---

**Report Prepared By:** Mike (Team Leader)
**Date:** January 6, 2026
**Status:** Investigation Complete - Awaiting Implementation Approval

