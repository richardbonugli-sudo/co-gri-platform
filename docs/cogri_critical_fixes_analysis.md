# CO-GRI Methodology Critical Fixes - Analysis & Implementation Plan

## Document Overview
This analysis addresses critical bugs in the CO-GRI Step 1 assessment methodology identified in the user-provided document (`cogrimore.docx`). The issues span evidence handling, unit normalization, merge logic, and fallback construction across all four channels (Revenue, Supply, Assets, Financial).

---

## Executive Summary

### What's Working (Preserve As-Is)
1. **Correct structured table detection** - Revenue channel correctly identifies "Net Sales by Geographic Segment"
2. **Label classification** - Americas, Europe, Greater China, Rest of Asia Pacific correctly identified as GEO_LABELs; Japan as COUNTRY
3. **SSF decomposition logic** - Membership resolution for resolvable labels is directionally correct
4. **RF-B/C/D enablement** - Recent Step 1 fix allows RF types to fire when closed totals exist (for residual labels)

### Critical Issues Requiring Fixes

#### **Priority 1: Data Integrity Issues**
1. **Unit drift (millions → percent)** - Values parsed in millions USD incorrectly displayed as percentages
2. **Direct allocations dropped** - Japan (Revenue), U.S. + China (Assets) detected but disappear in final output
3. **Ambiguous column selection** - Multi-period tables parsed incorrectly; values don't match source 10-K

#### **Priority 2: Semantic Clarity Issues**
4. **Weight vs Percentage field confusion** - Step-1 trace conflates raw magnitudes with normalized percentages
5. **Fallback reuse across channels** - Financial channel fallback mirrors Assets (should be U.S.-dominated)

#### **Priority 3: Methodology Compliance Issues**
6. **UI filtering/truncation** - Countries selected in pipeline don't appear in Step-1 output
7. **Channel naming mismatch** - δ channel labeled "Operations" vs "Financial"

---

## Detailed Issue Analysis

### Issue 1: Unit Drift (Millions → Percent)

**Current Behavior:**
- Step-0 correctly parses table values in millions USD
- Step-1 switches unit mode to "percent" 
- Totals displayed as `169,148%`, `101,328%` instead of `$169,148M`, `$101,328M`

**Root Cause:**
The `inferUnitMode()` function in `closedTotalValidation.ts` (lines 137-152) determines unit mode, but there's no enforcement to prevent unit conversion during allocation pipeline. The `computeLabelTotalWeight()` function (lines 157-184) may be converting absolute values to percentages prematurely.

**Expected Behavior:**
- Structured values remain in **raw units** (millions USD) until final normalization
- Unit mode should be locked throughout evidence selection and fallback resolution
- Only at the final step should raw weights be normalized to percentages (0-100%)

**Fix Location:**
- `src/services/v4/closedTotalValidation.ts` - Add unit mode locking
- `src/services/v4/v4Orchestrator.ts` - Preserve raw units through allocation pipeline
- `src/services/v4/allocators.ts` - Ensure normalization only happens at final step

---

### Issue 2: Direct Allocations Dropped

**Current Behavior:**
- **Revenue Channel**: Japan detected as COUNTRY in Step-0, appears in "Direct Allocations: 1" in UI Mapping Audit, but disappears in Step-1 output (weight collapses to ~0.0003% instead of expected ~6.8%)
- **Assets Channel**: U.S. and China detected in Step-0, "Direct Allocations: 2" reported, but final output shows U.S. at 0.011% (vs expected ~80%) and China at 0.0022% (vs expected ~7%)

**Root Cause:**
The `convertDirectToWeights()` function in `v4Orchestrator.ts` (lines 464-504) converts direct country allocations to weights, but subsequent merge operations or UI filtering may be dropping these countries. The `mergeAdd()` function (lines 239-252 in `allocators.ts`) should preserve direct allocations, but there may be a deduplication or filtering step that removes them.

**Expected Behavior:**
- **Invariant**: If DIRECT allocations exist, they MUST survive into final provenance
- Direct country weights should be locked and excluded from subsequent SSF/RF operations
- Final normalization should preserve direct allocations proportionally

**Fix Location:**
- `src/services/v4/v4Orchestrator.ts` - Ensure `lockedCountries` set properly excludes direct allocations from subsequent operations
- `src/services/v4/allocators.ts` - Verify `mergeAdd()` preserves all countries
- Check for UI filtering in output generation (may be in `uiMappingAudit.ts` or frontend rendering)

---

### Issue 3: Ambiguous Structured-Table Column Selection

**Current Behavior:**
- Apple's revenue table contains multiple periods (2023, 2024, 2025) and multiple column types (full year, partial periods)
- Parsed values don't match any single column cleanly:
  - Japan: 24,257 (doesn't match reported values)
  - Americas: 169,148 (doesn't match $178,353M for 2025)
- Suggests parser is either mixing columns or summing multiple periods

**Root Cause:**
The `extractRevenueStructuredItems()` function in `evidenceExtractor.ts` (lines 93-138) doesn't specify which column to select when multiple periods exist. The parsing logic needs to:
1. Detect all available periods/columns
2. Deterministically select ONE column only
3. Prefer most recent year + most complete period

**Expected Behavior:**
- When structured table contains multiple periods:
  - Deterministically select **one column only**
  - Prefer **most recent year** and **most complete period** (per methodology)
  - **Never add** multiple periods together

**Fix Location:**
- `src/services/v4/evidenceExtractor.ts` - Add column selection logic to `extractRevenueStructuredItems()` and `extractAssetsStructuredItems()`
- May need to add metadata to `StructuredItem` type to track period/year
- Add validation to ensure single-period selection

---

### Issue 4: Weight vs Percentage Field Confusion

**Current Behavior:**
- Step-1 decision trace shows:
  - "Total Weight" displayed as percentage (e.g., `29,615,000.00%`)
  - "Weight" and "Percentage" columns both show percent-scaled values
- Unclear whether "Weight" represents raw magnitude or normalized percentage

**Root Cause:**
The debug trace generation (likely in `decisionTrace.ts` or `debugBundleGenerator.ts`) doesn't clearly separate:
- Raw weight (pre-normalization magnitude in native units)
- Normalized percentage (post-normalization share 0-100%)

**Expected Behavior:**
Define clear field semantics in debug traces:
- **Step-0 Value**: Raw extracted magnitude from source table (e.g., millions USD) with year/period metadata
- **Unit Mode**: Raw/native through evidence selection; normalized percent only at final output
- **Total Weight (Label Level)**: Raw total value (with units) OR normalized share of global total (but NOT raw values displayed as percent)
- **Top Allocation - Weight**: Raw allocated value (label total × share-of-label)
- **Top Allocation - Percentage**: 
  - Share-of-label (%) for SSF resolution debug blocks
  - Share-of-global (%) for Step-1 country provenance and final outputs
- **Pre-Normalize Sum**: Sum of all raw allocated values in native units (before normalization)
- **Post-Normalize Sum**: 1.0 (or 100%) after normalization

**Fix Location:**
- `src/services/v4/decisionTrace.ts` - Restructure trace object to separate raw weights from percentages
- `src/services/v4/debugBundleGenerator.ts` - Update debug output formatting
- Update `TraceObject` and `LabelAllocation` types in `@/types/v4Types.ts`

---

### Issue 5: Fallback Reuse Across Channels

**Current Behavior:**
- Financial channel fallback country set:
  - Dominated by China
  - Excludes U.S.
  - Closely mirrors Assets fallback
- Expected: U.S. should dominate Apple's financial exposure even under fallback

**Root Cause:**
The `buildRestrictedSetP()` function in `restrictedSetBuilder.ts` may not be properly isolating channel-specific fallback construction. The function should build different restricted sets for different channels based on:
- Channel-specific narrative evidence
- Channel-specific sector multipliers
- Home country bias (especially for Financial channel)

**Expected Behavior:**
- **Channel-specific fallback isolation**
- Financial channel should heavily weight home country (U.S. for Apple)
- Each channel's restricted set P should be built independently
- No reuse of fallback outputs across channels

**Fix Location:**
- `src/services/v4/restrictedSetBuilder.ts` - Ensure channel-specific logic
- `src/services/v4/allocators.ts` - Verify `getRFScore()` applies channel-specific multipliers correctly
- May need to add channel-specific bias parameters

---

### Issue 6: Parsed Values Don't Match 10-K

**Current Behavior (Assets Channel):**
- Debug report shows:
  - U.S. ≈ 40,200 vs 40,274 (2025 in 10-K)
  - China ≈ 8,100 vs 3,617 (2025 in 10-K)
  - Other ≈ 7,500 vs 5,943 (2025 in 10-K)
- Suggests incorrect column selection and/or column summation

**Root Cause:**
Same as Issue 3 - multi-period table parsing without deterministic column selection.

**Expected Behavior:**
- Values must match source 10-K exactly for the selected period
- Add validation to compare parsed values against known ground truth

**Fix Location:**
- `src/services/v4/evidenceExtractor.ts` - Fix `extractAssetsStructuredItems()`
- Add unit tests with Apple 10-K ground truth values

---

### Issue 7: Pre-Normalize Sum Incorrect (Assets Channel)

**Current Behavior:**
- Step-4 shows Pre-normalize sum ≈ 7,501
- This equals only "Other" value, suggesting U.S. and China were dropped before normalization

**Root Cause:**
Related to Issue 2 - direct allocations being dropped. The `computeLabelTotalWeight()` function may be excluding direct countries incorrectly.

**Expected Behavior:**
- Pre-normalize sum must equal sum of ALL raw structured (and SSF-expanded) country values in native units
- Should include direct allocations + label allocations

**Fix Location:**
- `src/services/v4/v4Orchestrator.ts` - Verify direct allocations are included in pre-normalize sum
- `src/services/v4/closedTotalValidation.ts` - Fix `computeLabelTotalWeight()` to include all countries

---

## Implementation Plan

### Phase 1: Data Integrity Fixes (Priority 1)

#### Task 1.1: Fix Unit Drift
**Files to modify:**
- `src/services/v4/closedTotalValidation.ts`
- `src/services/v4/v4Orchestrator.ts`
- `src/services/v4/allocators.ts`

**Changes:**
1. Add `unitMode` tracking to `TraceObject` and `LabelAllocation` types
2. Lock unit mode at evidence extraction and preserve through allocation
3. Only convert to percentages at final normalization step
4. Update `computeLabelTotalWeight()` to return raw values without premature conversion

**Validation:**
- Unit tests: Verify raw values preserved through pipeline
- Integration test: Check Apple Revenue channel shows millions USD until final step

#### Task 1.2: Preserve Direct Allocations
**Files to modify:**
- `src/services/v4/v4Orchestrator.ts` (lines 82-109, 464-504)
- `src/services/v4/allocators.ts` (lines 239-252)

**Changes:**
1. Add assertion: Direct allocations MUST appear in final weights
2. Verify `lockedCountries` set properly excludes direct countries from SSF/RF
3. Add debug logging to track direct allocation survival
4. Investigate UI filtering/truncation (check frontend rendering)

**Validation:**
- Unit test: Japan (Revenue) survives with ~6.8% weight
- Unit test: U.S. (Assets) survives with ~80% weight, China with ~7%

#### Task 1.3: Fix Column Selection for Multi-Period Tables
**Files to modify:**
- `src/services/v4/evidenceExtractor.ts` (lines 93-138, 146-191)
- Add new types to `@/types/v4Types.ts` for period metadata

**Changes:**
1. Add period/year detection logic to structured item extraction
2. Implement deterministic column selection:
   - Prefer most recent year
   - Prefer most complete period (full year > partial)
   - Never sum multiple periods
3. Add `period` and `year` fields to `StructuredItem` type
4. Add validation to compare parsed values against ground truth

**Validation:**
- Unit test: Apple Revenue 2025 values match 10-K exactly
- Unit test: Apple Assets 2025 values match 10-K exactly

---

### Phase 2: Semantic Clarity Fixes (Priority 2)

#### Task 2.1: Restructure Debug Trace Fields
**Files to modify:**
- `src/services/v4/decisionTrace.ts`
- `src/services/v4/debugBundleGenerator.ts`
- `@/types/v4Types.ts` (update `TraceObject`, `LabelAllocation` types)

**Changes:**
1. Separate raw weight from normalized percentage in trace objects
2. Add clear field definitions:
   - `rawWeight`: Pre-normalization magnitude in native units
   - `normalizedPercentage`: Post-normalization share (0-1 or 0-100%)
   - `unitMode`: Track unit type throughout pipeline
3. Update debug output formatting to clearly label raw vs normalized values
4. Add documentation comments explaining field semantics

**Validation:**
- Manual review: Debug traces clearly distinguish raw weights from percentages
- No more "29,615,000.00%" confusion

#### Task 2.2: Enforce Channel-Specific Fallback Isolation
**Files to modify:**
- `src/services/v4/restrictedSetBuilder.ts`
- `src/services/v4/allocators.ts` (lines 158-183)

**Changes:**
1. Add channel-specific bias parameters to `buildRestrictedSetP()`
2. For Financial channel, add strong home country bias
3. Verify `getRFScore()` applies channel-specific multipliers correctly
4. Add assertions to prevent fallback reuse across channels

**Validation:**
- Unit test: Financial channel for U.S. company heavily weights U.S.
- Integration test: Financial fallback ≠ Assets fallback for same company

---

### Phase 3: Methodology Compliance Fixes (Priority 3)

#### Task 3.1: Investigate UI Filtering/Truncation
**Files to check:**
- `src/services/v4/uiMappingAudit.ts`
- Frontend components rendering Step-1 output
- Any pagination/filtering logic in output generation

**Changes:**
1. Identify where countries are being filtered/truncated
2. Remove or fix filtering logic to preserve all countries
3. Add validation: All countries in pipeline must appear in final output

**Validation:**
- Integration test: India, South Korea appear in Supply channel output
- All countries with weight > 0 appear in UI

#### Task 3.2: Fix Channel Naming (Operations → Financial)
**Files to modify:**
- Search codebase for "Operations" label
- Update to "Financial" for consistency

**Changes:**
1. Find all references to "Operations" channel
2. Rename to "Financial" (δ channel)
3. Update any hardcoded channel names

**Validation:**
- All UI displays show "Financial" not "Operations"

---

## Testing Strategy

### Unit Tests
1. **Unit Drift**: Verify raw values preserved through allocation pipeline
2. **Direct Allocations**: Test Japan (Revenue), U.S./China (Assets) survival
3. **Column Selection**: Test multi-period table parsing with ground truth
4. **Fallback Isolation**: Test channel-specific restricted set construction

### Integration Tests
1. **Apple Revenue Channel**: End-to-end test with 2025 10-K data
2. **Apple Assets Channel**: End-to-end test with 2025 10-K data
3. **Apple Supply Channel**: Verify Taiwan, India, South Korea appear in output
4. **Apple Financial Channel**: Verify U.S. dominates fallback

### Regression Tests
1. Re-run existing test suites after each fix
2. Ensure no degradation in other channels
3. Verify Step 1 fix (RF-B/C/D enablement) still works

---

## Success Criteria

### Must-Have (Phase 1)
- [ ] Unit mode locked until final normalization (no "169,148%" display)
- [ ] Japan appears in Revenue output with ~6.8% weight
- [ ] U.S. appears in Assets output with ~80% weight
- [ ] China appears in Assets output with ~7% weight
- [ ] Parsed values match 10-K exactly for selected period

### Should-Have (Phase 2)
- [ ] Debug traces clearly separate raw weights from percentages
- [ ] Financial channel fallback dominated by U.S. (not China)
- [ ] No fallback reuse across channels

### Nice-to-Have (Phase 3)
- [ ] All countries in pipeline appear in final output (no truncation)
- [ ] Channel naming consistent (Financial not Operations)
- [ ] Comprehensive documentation of field definitions

---

## Risk Assessment

### High Risk
- **Breaking existing functionality**: Changes to core allocation logic may affect other companies/sectors
- **Mitigation**: Comprehensive regression testing, feature flags for new logic

### Medium Risk
- **Performance impact**: Additional validation/logging may slow down calculations
- **Mitigation**: Profile performance, optimize hot paths

### Low Risk
- **UI changes**: Renaming fields in debug traces is low-risk
- **Mitigation**: Update frontend components to match new field names

---

## Next Steps

1. **Review this analysis** with team/stakeholders
2. **Prioritize fixes** based on impact and effort
3. **Create detailed implementation tasks** for each fix
4. **Set up test data** (Apple 10-K ground truth values)
5. **Implement Phase 1 fixes** (data integrity)
6. **Run regression tests** after each fix
7. **Iterate through Phases 2-3** as time permits

---

## Appendix: File Structure

### Core V4 Files
- `v4Orchestrator.ts` - Main allocation engine
- `evidenceExtractor.ts` - Structured/narrative evidence extraction
- `closedTotalValidation.ts` - Closed total detection and validation
- `allocators.ts` - SSF, RF, GF allocation functions
- `restrictedSetBuilder.ts` - Restricted set P construction
- `labelResolution.ts` - Label classification and membership resolution
- `rfTaxonomy.ts` - RF type classification (A/B/C/D)
- `decisionTrace.ts` - Debug trace generation
- `debugBundleGenerator.ts` - Debug bundle creation
- `uiMappingAudit.ts` - UI mapping validation

### Test Files
- `__tests__/step1_mixed_evidence.test.ts` - Mixed evidence patterns
- `__tests__/step1_regression.test.ts` - Regression tests
- `__tests__/step1_phase1_apple_tests.test.ts` - Apple-specific tests
- `__tests__/step1_phase2_narrative_tests.test.ts` - Narrative evidence tests

---

## Document Version
- **Version**: 1.0
- **Date**: 2026-01-10
- **Author**: Alex (Engineer)
- **Status**: Draft for Review