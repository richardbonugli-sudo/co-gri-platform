# Step 1 Fix - Manual Testing Guide

**Date:** January 6, 2026  
**Prepared By:** Alex (Engineer)  
**Purpose:** Comprehensive guide for validating Step 1 logic fixes with real company data

---

## Overview

This guide provides step-by-step instructions for manually testing the Step 1 logic fix in a staging environment with real company data. The fix enables RF-B/C/D to fire when closed totals exist (for residual labels), improving allocation accuracy for 15-25% of companies.

**Testing Duration:** 30-45 minutes  
**Companies to Test:** Apple (AAPL), Tesla (TSLA), Microsoft (MSFT)  
**Critical Test:** Apple Physical Assets (PP&E) "Other countries" allocation

---

## Prerequisites

### Environment Setup

1. **Staging Environment Access**
   - URL: [YOUR_STAGING_URL]
   - Login credentials: [IF REQUIRED]
   - Browser: Chrome/Firefox (latest version)

2. **Browser Console Access**
   - Open Developer Tools (F12 or Cmd+Option+I)
   - Navigate to Console tab
   - Enable "Preserve log" option

3. **Documentation Tools**
   - Screenshot tool ready
   - Text editor for copying console logs
   - This validation report template: `step1_staging_validation_report.md`

---

## Test 1: Apple Inc. (AAPL) - PRIMARY VALIDATION

### A. Physical Assets (PP&E) Channel - CRITICAL TEST

**Objective:** Verify "Other countries" residual label now receives RF-B allocation

**Expected Outcome:**
- ✅ "Other countries" receives ~11.9% allocation via RF-B
- ✅ United States receives ~80.8% via DIRECT
- ✅ China bucket receives ~7.3% via SSF
- ✅ Total allocation sums to ~100%

**Steps:**

1. **Navigate to Assessment Tool**
   ```
   → Open staging environment
   → Click "Assess a Company or Ticker"
   → Enter ticker: AAPL
   → Click "Assess" or "Submit"
   ```

2. **Locate Physical Assets (PP&E) Results**
   ```
   → Wait for assessment to complete
   → Scroll to "Physical Assets" or "Long-Lived Assets" section
   → Look for geographic breakdown table
   ```

3. **Record Allocation Breakdown**
   
   Take a screenshot and record the following:
   
   | Geographic Label | Percentage | Allocation Method |
   |-----------------|------------|-------------------|
   | United States | ___._% | DIRECT/SSF/RF-? |
   | China | ___._% | DIRECT/SSF/RF-? |
   | Other countries | ___._% | DIRECT/SSF/RF-? |
   | **TOTAL** | ___._% | |

4. **Check Console Logs**
   
   In browser console, look for trace logs like:
   ```javascript
   [V4 Orchestrator] STEP1: direct country-level structured evidence allocated + locked
   [V4 Orchestrator] STEP2: closed allocatable label totals detected => label-by-label allocation
   [V4 Orchestrator] Label "China": SSF applied (resolvable membership)
   [V4 Orchestrator] Label "Other countries": RF-B applied (residual only)
   [V4 Orchestrator] Restricted Set P: {Vietnam, India, Mexico, ...}
   [V4 Orchestrator] END: direct + SSF + RF-B merged and normalized
   ```
   
   Copy and paste relevant logs to validation report.

5. **Validation Checklist**
   
   Mark YES/NO for each:
   - [ ] United States uses DIRECT allocation
   - [ ] China uses SSF allocation (footnote definition)
   - [ ] "Other countries" receives **non-zero** allocation
   - [ ] "Other countries" uses **RF-B** allocation (check console log)
   - [ ] Total allocation sums to ~100% (±0.5%)
   - [ ] Console log shows "RF-B applied to 'Other countries'"

**Expected Console Log Pattern:**
```
[V4 Orchestrator] Label "Other countries": RF-B applied (residual only)
Reason: closed total but membership not resolvable; named countries exist => RF-B
Restricted Set P: {Vietnam, India, Mexico, Thailand, Malaysia, ...}
```

**⚠️ CRITICAL:** If "Other countries" shows 0% or uses RF-A instead of RF-B, the fix did NOT work correctly.

---

### B. Revenue Channel - REGRESSION TEST

**Objective:** Verify no regression, SSF should still work correctly

**Expected Outcome:**
- ✅ Japan uses DIRECT allocation (~7.0%)
- ✅ All segment labels use SSF allocation
- ✅ NO RF allocation needed
- ✅ Total allocation sums to ~100%

**Steps:**

1. **Locate Revenue Results**
   ```
   → In same AAPL assessment
   → Scroll to "Revenue" or "Net Sales" section
   → Look for geographic segment breakdown
   ```

2. **Record Allocation Breakdown**
   
   | Geographic Segment | Percentage | Allocation Method |
   |-------------------|------------|-------------------|
   | Americas | ___._% | DIRECT/SSF/RF-? |
   | Europe | ___._% | DIRECT/SSF/RF-? |
   | Greater China | ___._% | DIRECT/SSF/RF-? |
   | Japan | ___._% | DIRECT/SSF/RF-? |
   | Rest of Asia Pacific | ___._% | DIRECT/SSF/RF-? |
   | **TOTAL** | ___._% | |

3. **Check Console Logs**
   
   Look for:
   ```javascript
   [V4 Orchestrator] Label "Americas": SSF applied (resolvable membership)
   [V4 Orchestrator] Label "Europe": SSF applied (resolvable membership)
   [V4 Orchestrator] Label "Greater China": SSF applied (resolvable membership)
   [V4 Orchestrator] Label "Rest of Asia Pacific": SSF applied (resolvable membership)
   ```

4. **Validation Checklist**
   
   - [ ] Japan uses DIRECT allocation
   - [ ] All segment labels (Americas, Europe, Greater China, Rest of Asia Pacific) use SSF
   - [ ] NO RF allocation used for any label
   - [ ] Total allocation sums to ~100%
   - [ ] Results match previous behavior (no regression)

**⚠️ REGRESSION CHECK:** If any segment label uses RF instead of SSF, there's a regression.

---

### C. Supply Chain Channel - REGRESSION TEST

**Objective:** Verify RF-B for 100% of channel (no change)

**Expected Outcome:**
- ✅ RF-B applies to 100% of channel
- ✅ Named countries from narrative used
- ✅ No change from previous behavior

**Steps:**

1. **Locate Supply Chain Results**
   ```
   → In same AAPL assessment
   → Scroll to "Supply Chain" or "Manufacturing" section
   → Look for allocation method description
   ```

2. **Record Allocation Details**
   
   | Attribute | Value |
   |-----------|-------|
   | Allocation Method | DIRECT/SSF/RF-A/RF-B/RF-C/RF-D/GF |
   | Percentage Allocated | ___._% |
   | Named Countries Used | [LIST] |

3. **Check Console Logs**
   
   Look for:
   ```javascript
   [V4 Orchestrator] No closed totals detected
   [V4 Orchestrator] RF-B applies to 100% of channel
   [V4 Orchestrator] Restricted Set P: {China, Vietnam, India, Mexico, ...}
   ```

4. **Validation Checklist**
   
   - [ ] RF-B applies to 100% of channel
   - [ ] Named countries from narrative used (China, Vietnam, India, Mexico, etc.)
   - [ ] Results match previous behavior (no regression)

---

## Test 2: Tesla Inc. (TSLA)

### A. Revenue Channel

**Objective:** Verify residual labels like "Other regions" now allocate correctly

**Steps:**

1. **Run Assessment**
   ```
   → Navigate to "Assess a Company or Ticker"
   → Enter ticker: TSLA
   → Click "Assess"
   ```

2. **Locate Revenue Results**
   ```
   → Scroll to "Revenue" section
   → Look for geographic breakdown
   → Identify any residual labels (e.g., "Other regions", "Rest of world")
   ```

3. **Record Allocation Breakdown**
   
   | Geographic Label | Percentage | Allocation Method | Notes |
   |-----------------|------------|-------------------|-------|
   | [SEGMENT 1] | ___._% | DIRECT/SSF/RF-? | |
   | [SEGMENT 2] | ___._% | DIRECT/SSF/RF-? | |
   | [RESIDUAL LABEL] | ___._% | DIRECT/SSF/RF-? | ← FOCUS HERE |
   | **TOTAL** | ___._% | | |

4. **Check Console Logs**
   
   Look for RF-B/C/D allocation to residual labels:
   ```javascript
   [V4 Orchestrator] Label "[RESIDUAL]": RF-B/C/D applied (residual only)
   ```

5. **Validation Checklist**
   
   - [ ] Residual labels receive **non-zero** allocation
   - [ ] Residual labels use appropriate RF-B/C/D (not RF-A)
   - [ ] Well-defined segments show no regression
   - [ ] Total allocation sums to ~100%

---

### B. Assets Channel

**Objective:** Verify any residual labels allocate correctly

**Steps:**

1. **Locate Assets Results**
   ```
   → In same TSLA assessment
   → Scroll to "Assets" or "Property and Equipment" section
   → Look for geographic breakdown
   ```

2. **Record Allocation Breakdown**
   
   | Geographic Label | Percentage | Allocation Method |
   |-----------------|------------|-------------------|
   | [SEGMENT 1] | ___._% | DIRECT/SSF/RF-? |
   | [SEGMENT 2] | ___._% | DIRECT/SSF/RF-? |
   | [RESIDUAL LABEL] | ___._% | DIRECT/SSF/RF-? |
   | **TOTAL** | ___._% | |

3. **Validation Checklist**
   
   - [ ] Residual labels receive appropriate RF allocation
   - [ ] Total allocation sums to ~100%

---

## Test 3: Microsoft Corp. (MSFT)

### A. Revenue Channel

**Objective:** Verify "Rest of world" or similar residual labels allocate correctly

**Steps:**

1. **Run Assessment**
   ```
   → Navigate to "Assess a Company or Ticker"
   → Enter ticker: MSFT
   → Click "Assess"
   ```

2. **Locate Revenue Results**
   ```
   → Scroll to "Revenue" section
   → Look for geographic breakdown
   → Identify "Rest of world" or similar residual labels
   ```

3. **Record Allocation Breakdown**
   
   | Geographic Label | Percentage | Allocation Method | Notes |
   |-----------------|------------|-------------------|-------|
   | [SEGMENT 1] | ___._% | DIRECT/SSF/RF-? | |
   | [SEGMENT 2] | ___._% | DIRECT/SSF/RF-? | |
   | [RESIDUAL LABEL] | ___._% | DIRECT/SSF/RF-? | ← FOCUS HERE |
   | **TOTAL** | ___._% | | |

4. **Check Console Logs**
   
   Look for RF-B/C/D allocation to residual labels.

5. **Validation Checklist**
   
   - [ ] Residual labels receive **non-zero** allocation
   - [ ] Residual labels use appropriate RF-B/C/D
   - [ ] Defined segments show no regression
   - [ ] Total allocation sums to ~100%

---

## Validation Metrics to Track

### 1. Allocation Accuracy

For each company, calculate:
```
Allocation Accuracy = (Sum of all percentages) / 100%
Target: 99.5% - 100.5%
```

### 2. Residual Label Coverage

Count residual labels that:
- Received zero allocation (BEFORE FIX)
- Received non-zero allocation (AFTER FIX)

```
Improvement = (Labels with allocation AFTER) / (Total residual labels) × 100%
Target: >90%
```

### 3. RF Type Distribution

For each RF allocation, record the type:
- RF-A: Conservative (no membership evidence)
- RF-B: Named countries exist
- RF-C: Geo labels exist
- RF-D: Partial structured evidence exists

**Expected:** RF-B/C/D usage should increase significantly for residual labels.

### 4. Validation Warnings

Count validation warnings by severity:
- CRITICAL: 🔴 (should be <1%)
- HIGH: 🟠 (should be <10%)
- MEDIUM: 🟡 (acceptable)
- LOW: ⚪ (acceptable)

---

## Success Criteria

**ALL must be YES to proceed to production:**

1. ✅ Build successful (already verified)
2. ✅ Apple PP&E "Other countries" receives non-zero allocation via RF-B
3. ✅ Apple Revenue shows no regression (SSF still works)
4. ✅ Apple Supply Chain shows no regression (RF-B for 100% still works)
5. ✅ Tesla tests show improvements (residual labels allocated)
6. ✅ Microsoft tests show improvements (residual labels allocated)
7. ✅ All allocation totals sum to ~100% (±0.5%)
8. ✅ No critical validation warnings or errors
9. ✅ Console logs confirm RF-B/C/D firing for residual labels

**If ANY criterion is NO:** Document the issue and DO NOT proceed to production.

---

## Recording Results

### Update Validation Report

After completing all tests, update `/workspace/shadcn-ui/docs/step1_staging_validation_report.md` with:

1. **Actual Results:** Fill in all [TO BE FILLED] sections
2. **Screenshots:** Attach screenshots of key results
3. **Console Logs:** Copy and paste relevant console logs
4. **Issues:** Document any issues encountered
5. **Metrics:** Calculate and record all validation metrics
6. **Recommendation:** Based on results, recommend PROCEED or NEEDS FIXES

### Report Template Sections to Complete

- [ ] Deployment Summary → Health Checks
- [ ] Test 1A → Actual Results and Validation Checks
- [ ] Test 1B → Actual Results and Validation Checks
- [ ] Test 1C → Actual Results and Validation Checks
- [ ] Test 2A → Actual Results and Validation Checks
- [ ] Test 2B → Actual Results and Validation Checks
- [ ] Test 3A → Actual Results and Validation Checks
- [ ] Validation Metrics → All measurements
- [ ] Issues and Observations → Document any issues
- [ ] Success Criteria Checklist → Mark all YES/NO
- [ ] Recommendation → Final recommendation

---

## Troubleshooting

### Issue: "Other countries" shows 0% allocation

**Possible Causes:**
1. Fix not deployed correctly
2. Wrong version running
3. Cache not cleared

**Resolution:**
1. Verify build version matches
2. Clear browser cache
3. Check console for errors
4. Verify v4Orchestrator.ts changes are present

### Issue: Console logs not showing

**Resolution:**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Enable "Preserve log"
4. Refresh page
5. Run assessment again

### Issue: Allocation doesn't sum to 100%

**Possible Causes:**
1. Rounding errors (acceptable if ±0.5%)
2. Missing data
3. Allocation logic error

**Resolution:**
1. If within ±0.5%, acceptable
2. If >0.5% difference, document as issue
3. Check console logs for warnings

### Issue: Regression detected (SSF not working)

**CRITICAL - STOP TESTING**

**Resolution:**
1. Document the regression
2. Capture screenshots and console logs
3. Recommend ROLLBACK
4. Do NOT proceed to production

---

## Next Steps After Validation

### If All Tests Pass

1. **Complete Validation Report**
   - Fill in all actual results
   - Attach screenshots
   - Copy console logs
   - Calculate metrics
   - Recommendation: PROCEED TO PRODUCTION

2. **Review with Team**
   - Share validation report
   - Discuss any observations
   - Get approval from stakeholders

3. **Proceed to Production Deployment**
   - Follow production deployment checklist
   - Monitor closely for first 24-48 hours
   - Track same metrics in production

### If Any Tests Fail

1. **Document Issues**
   - Detailed description
   - Screenshots
   - Console logs
   - Severity assessment

2. **Recommendation: NEEDS FIXES or ROLLBACK**
   - Do NOT proceed to production
   - Investigate root cause
   - Create fix
   - Re-test in staging

3. **Notify Team**
   - Share validation report with issues
   - Discuss resolution plan
   - Schedule re-testing

---

## Appendix A: Expected Console Log Patterns

### Apple PP&E (Success Pattern)

```javascript
[V4 Orchestrator] STEP0: evidence extracted
[V4 Orchestrator] STEP1: direct country-level structured evidence allocated + locked
  → United States: 80.8% (DIRECT)
  → Locked countries: {United States}

[V4 Orchestrator] STEP2: closed allocatable label totals detected => label-by-label allocation

[V4 Orchestrator] Label "China": SSF applied
  → Membership resolved from footnote: {China, Hong Kong, Taiwan}
  → Allocated: 7.3%
  → Locked countries: {United States, China, Hong Kong, Taiwan}

[V4 Orchestrator] Label "Other countries": RF-B applied (residual only)
  → Reason: closed total but membership not resolvable; named countries exist => RF-B
  → Restricted Set P: {Vietnam, India, Mexico, Thailand, Malaysia, ...}
  → Exclusions: {United States, China, Hong Kong, Taiwan}
  → Allocated: 11.9%

[V4 Orchestrator] END: direct + SSF + RF-B merged and normalized
  → Total weight: 1.0 (100%)
```

### Apple Revenue (Success Pattern)

```javascript
[V4 Orchestrator] STEP1: direct country-level structured evidence allocated + locked
  → Japan: 7.0% (DIRECT)

[V4 Orchestrator] STEP2: closed allocatable label totals detected => label-by-label allocation

[V4 Orchestrator] Label "Americas": SSF applied
  → Membership resolved: {United States, Canada, Mexico, Brazil, ...}
  → Allocated: 42.8%

[V4 Orchestrator] Label "Europe": SSF applied
  → Membership resolved: {Germany, France, UK, India, Middle East, Africa, ...}
  → Allocated: 26.2%

[V4 Orchestrator] Label "Greater China": SSF applied
  → Membership resolved: {China, Hong Kong, Taiwan}
  → Allocated: 15.9%

[V4 Orchestrator] Label "Rest of Asia Pacific": SSF applied
  → Membership resolved: {Australia, Singapore, South Korea, ...}
  → Allocated: 8.1%

[V4 Orchestrator] END: direct + SSF merged and normalized
  → Total weight: 1.0 (100%)
  → NO RF USED (all labels resolvable)
```

---

## Appendix B: Quick Reference Checklist

**Print this page for quick reference during testing:**

### Apple (AAPL) - PP&E
- [ ] United States: ~80.8% (DIRECT)
- [ ] China: ~7.3% (SSF)
- [ ] Other countries: ~11.9% (RF-B) ← **CRITICAL**
- [ ] Total: ~100%
- [ ] Console log shows RF-B for "Other countries"

### Apple (AAPL) - Revenue
- [ ] Japan: ~7.0% (DIRECT)
- [ ] All segments use SSF
- [ ] NO RF used
- [ ] Total: ~100%

### Apple (AAPL) - Supply Chain
- [ ] RF-B: 100% of channel
- [ ] Named countries used

### Tesla (TSLA)
- [ ] Residual labels allocated (non-zero)
- [ ] RF-B/C/D used (not RF-A)
- [ ] Total: ~100%

### Microsoft (MSFT)
- [ ] Residual labels allocated (non-zero)
- [ ] RF-B/C/D used (not RF-A)
- [ ] Total: ~100%

---

**Prepared By:** Alex (Engineer)  
**Date:** January 6, 2026  
**Version:** 1.0  
**Status:** Ready for Manual Testing