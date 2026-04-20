# Phase 1: Evidence Detection & Locking - Implementation Plan

**Timeline:** Weeks 1-2  
**Status:** IN PROGRESS  
**Last Updated:** 2026-01-08

---

## Overview

Phase 1 addresses the most critical issues in Step 1 COGRI calculation:
1. Revenue Channel - Structured tables not detected/locked
2. Physical Assets Channel - Wrong table selection/cached data
3. Evidence locking mechanism to prevent RF override

**Target Success Criteria:**
- Revenue: Structured tables detected 95%+ of time
- Physical Assets: Correct table selected 95%+ of time
- No RF override when structured evidence exists

---

## Current State Analysis

### Files Reviewed:
1. `/workspace/shadcn-ui/src/services/v4/evidenceExtractor.ts` - Evidence extraction logic
2. `/workspace/shadcn-ui/src/services/v4/closedTotalValidation.ts` - Table detection logic
3. `/workspace/shadcn-ui/src/services/v4/v4Orchestrator.ts` - Main allocation orchestrator
4. `/workspace/shadcn-ui/src/services/v4/labelResolution.ts` - Label classification
5. `/workspace/shadcn-ui/src/services/v4/rfTaxonomy.ts` - RF type classification
6. `/workspace/shadcn-ui/src/services/v4/restrictedSetBuilder.ts` - Restricted set building

### Recent Bug Fix Completed:
- Step 1 logic bug fix completed (11/11 tests passing)
- Fixed RF type classification priority
- Fixed closed total label detection for COUNTRY entities with definitions
- Fixed residual label handling in RF_C classification

### Remaining Issues (Per Investigation Report):

**Issue #1: Revenue Channel - Tables Not Detected**
- Root Cause: Parser not extracting tables from raw filing data
- Current State: `extractRevenueStructuredItems()` expects pre-parsed data in `companyData.revenueGeography`
- Problem: No raw filing parser implemented to extract tables from 10-K HTML/XBRL

**Issue #2: Physical Assets Channel - Wrong Table/Cached Data**
- Root Cause: Cache not channel-specific; stale data reuse
- Current State: `extractAssetsStructuredItems()` expects pre-parsed data
- Problem: Cache key doesn't include channel or filing period

**Issue #3: Evidence Locking**
- Current State: Evidence locking partially implemented in v4Orchestrator
- Problem: Need stronger guarantees that RF cannot override structured evidence

---

## Implementation Strategy

### Task 1: Create Comprehensive Test Suite (Week 1, Days 1-2)

**Objective:** Establish baseline tests with Apple (AAPL) as primary test case

**Test Cases to Create:**
1. `apple_revenue_test.ts` - Revenue channel with 2 structured tables
2. `apple_assets_test.ts` - Physical Assets channel with long-lived assets table
3. `apple_supply_test.ts` - Supply Chain channel with narrative evidence
4. `apple_financial_test.ts` - Financial channel with limited evidence
5. `evidence_locking_test.ts` - Verify RF cannot override structured evidence

**Test Data Structure:**
```typescript
const appleRevenueData = {
  ticker: 'AAPL',
  filingPeriod: '2024-Q4',
  revenueGeography: [
    { segment: 'Americas', value: 178353, unit: 'currency', source: 'Segment Operating Performance' },
    { segment: 'Europe', value: 111032, unit: 'currency', source: 'Segment Operating Performance' },
    { segment: 'Greater China', value: 64377, unit: 'currency', source: 'Segment Operating Performance' },
    { segment: 'Japan', value: 28703, unit: 'currency', source: 'Segment Operating Performance' },
    { segment: 'Rest of Asia Pacific', value: 33696, unit: 'currency', source: 'Segment Operating Performance' },
    { country: 'United States', value: 151790, unit: 'currency', source: 'Net Sales' },
    { country: 'China', value: 64377, unit: 'currency', source: 'Net Sales' },
    { label: 'Other countries', value: 199994, unit: 'currency', source: 'Net Sales' }
  ],
  labelDefinitions: {
    'Americas': { membership: ['United States', 'Canada', 'Mexico', 'Brazil'], membershipSource: 'Footnote' },
    'Europe': { membership: ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain'], membershipSource: 'Footnote' },
    'Greater China': { membership: ['China', 'Hong Kong', 'Taiwan'], membershipSource: 'Footnote' },
    'Rest of Asia Pacific': { membership: ['Australia', 'New Zealand', 'Singapore', 'Indonesia'], membershipSource: 'Footnote' }
  }
};
```

**Deliverables:**
- [ ] Create test data fixtures for Apple
- [ ] Implement baseline tests (before fix)
- [ ] Document expected vs actual behavior
- [ ] Run tests and capture baseline metrics

---

### Task 2: Fix Evidence Extraction Logic (Week 1, Days 3-5)

**Objective:** Ensure structured tables are properly extracted and classified

**Changes Required:**

**2.1. Enhance `evidenceExtractor.ts`:**
- Add better handling for segment labels vs country labels
- Improve entity kind classification
- Add validation for table completeness

**2.2. Enhance `labelResolution.ts`:**
- Add more country name variants (e.g., "China mainland" → "China")
- Improve canonicalization logic
- Add better geo label detection

**2.3. Fix `closedTotalValidation.ts`:**
- Improve closed total detection
- Add better handling for currency vs percentage units
- Validate table structure before accepting

**Deliverables:**
- [ ] Update evidence extraction logic
- [ ] Add country name variants dictionary
- [ ] Improve table validation
- [ ] Run tests and verify improvements

---

### Task 3: Implement Evidence Locking Mechanism (Week 2, Days 1-2)

**Objective:** Prevent RF from overriding structured evidence

**Changes Required:**

**3.1. Strengthen Locking in `v4Orchestrator.ts`:**
```typescript
// Add explicit locking validation
function validateNoRFOverride(
  directAlloc: Map<string, number>,
  labelAllocations: LabelAllocation[]
): void {
  for (const [country, weight] of directAlloc.entries()) {
    // Check if any RF allocation touched this country
    for (const labelAlloc of labelAllocations) {
      if (labelAlloc.fallbackUsed !== FallbackType.SSF && labelAlloc.outputCountries.has(country)) {
        throw new Error(
          `EVIDENCE LOCKING VIOLATION: RF allocation touched locked country ${country}`
        );
      }
    }
  }
}
```

**3.2. Add Locking Trace:**
- Add `lockedCountries` to TraceObject
- Log all locking operations
- Validate locking at each step

**Deliverables:**
- [ ] Implement locking validation
- [ ] Add locking trace
- [ ] Add locking tests
- [ ] Verify no RF override in all test cases

---

### Task 4: Channel-Specific Cache Keys (Week 2, Days 3-4)

**Objective:** Fix cache behavior to prevent cross-channel leakage and stale data

**Changes Required:**

**4.1. Update Cache Key Design:**
```typescript
// OLD (WRONG):
cacheKey = `${ticker}`

// NEW (CORRECT):
cacheKey = `${ticker}_${channel}_${filingPeriod}`
```

**4.2. Add Cache Invalidation Logic:**
```typescript
function shouldInvalidateCache(
  ticker: string,
  channel: Channel,
  cachedFilingPeriod: string,
  latestFilingPeriod: string
): boolean {
  // Invalidate if newer filing available
  return latestFilingPeriod > cachedFilingPeriod;
}
```

**4.3. Add Cache Isolation:**
- Ensure each channel has separate cache namespace
- Add channel validation before cache lookup
- Log cache hits/misses for debugging

**Deliverables:**
- [ ] Update cache key design
- [ ] Implement invalidation logic
- [ ] Add cache isolation
- [ ] Test cache behavior across channels

---

### Task 5: Validation & Testing (Week 2, Day 5)

**Objective:** Comprehensive validation of Phase 1 fixes

**Validation Steps:**

**5.1. Run All Tests:**
```bash
cd /workspace/shadcn-ui
pnpm run test src/services/v4/__tests__/step1*.test.ts
```

**5.2. Before/After Comparison:**
- Compare Apple results before and after fixes
- Verify China exposure: 23% → ~15% (within cap)
- Verify US exposure: correct percentage maintained
- Verify no Ireland in Physical Assets

**5.3. Regression Testing:**
- Run existing test suite (11 tests)
- Ensure no regressions in simple cases
- Verify all tests still passing

**5.4. Performance Benchmarking:**
- Measure processing time before/after
- Target: < 5% performance degradation
- Log any performance issues

**Deliverables:**
- [ ] All tests passing (target: 20+ tests)
- [ ] Before/after comparison report
- [ ] Regression test results
- [ ] Performance benchmark results

---

## Success Metrics

**Quantitative:**
- [ ] Revenue: Structured tables detected 95%+ (currently ~0%)
- [ ] Physical Assets: Correct table selected 95%+ (currently ~60%)
- [ ] Evidence locking: 100% (no RF override of structured evidence)
- [ ] Test coverage: 20+ test cases passing
- [ ] Performance: < 5% degradation

**Qualitative:**
- [ ] Apple test case produces correct results
- [ ] No cross-channel leakage observed
- [ ] No stale data issues
- [ ] Code is well-documented and maintainable

---

## Risk Mitigation

**Risk #1: Parser Complexity**
- Mitigation: Start with pre-parsed test data; defer raw filing parsing to later phase
- Fallback: Use existing parser with enhanced validation

**Risk #2: Regression in Simple Cases**
- Mitigation: Comprehensive regression test suite
- Fallback: Rollback to previous version if critical regression found

**Risk #3: Performance Degradation**
- Mitigation: Performance benchmarking at each step
- Fallback: Optimize hot paths if degradation > 5%

---

## Next Steps

**Immediate (Today):**
1. Create Apple test data fixtures
2. Implement baseline tests
3. Run tests and document current behavior

**This Week:**
1. Fix evidence extraction logic
2. Enhance label resolution
3. Improve table validation

**Next Week:**
1. Implement evidence locking
2. Fix cache behavior
3. Comprehensive validation

---

**Status:** Ready to begin Task 1 (Create Comprehensive Test Suite)
