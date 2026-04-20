# Step 1 Fix Deployment Checklist

**Date:** January 6, 2026
**Prepared By:** Alex (Engineer)
**Deployment Type:** Step 1 Logic Fix (RF-B/C/D for Residual Labels)

---

## Pre-Deployment Verification

### Code Verification

- ✅ **Code changes implemented**
  - v4Orchestrator.ts: +144 lines (367 → 511 lines)
  - rfTaxonomy.ts: +32 lines (183 → 215 lines)

- ✅ **Build successful**
  - Command: `pnpm run build`
  - Result: ✅ 3,670 modules transformed in 22.26 seconds
  - Errors: 0 TypeScript compilation errors
  - Bundle size: 4,032.86 KB (+1.86 KB, 0.05% increase)

- ✅ **Test suite created**
  - step1_mixed_evidence.test.ts: 362 lines (5 tests)
  - step1_regression.test.ts: 369 lines (6 tests)
  - Total: 11 comprehensive test cases

- ✅ **Documentation created**
  - step1_fix_analysis.md: Root cause analysis
  - step1_fix_implementation_report.md: Implementation report
  - step1_v4_decision_tree.md: Updated decision tree
  - step1_deployment_checklist.md: This checklist

- ✅ **Risk assessment: LOW**
  - Localized changes (2 files, ~200 lines)
  - Extends existing patterns
  - Backward compatible
  - Comprehensive test coverage

### Feature Flag Configuration (Optional)

- ⏳ **Create feature flag** (if needed)
  ```typescript
  // config/features.ts
  export const FEATURES = {
    STEP1_FIX_ENABLED: process.env.STEP1_FIX_ENABLED === 'true' || true
  };
  ```

- ⏳ **Test feature flag toggle**
  - Enable: Verify new logic works
  - Disable: Verify old logic still works
  - Toggle: Verify smooth transition

---

## Staging Deployment

### Deploy to Staging

- ⏳ **Build production bundle**
  ```bash
  cd /workspace/shadcn-ui
  pnpm run build
  ```

- ⏳ **Deploy to staging environment**
  ```bash
  # Deployment commands specific to staging environment
  # Example:
  # aws s3 sync dist/ s3://staging-bucket/
  # aws cloudfront create-invalidation --distribution-id STAGING_DIST_ID --paths "/*"
  ```

- ⏳ **Verify deployment**
  - Check staging URL loads correctly
  - Check console for errors
  - Check build version matches

### Test with Real Company Data

- ⏳ **Test with Apple (AAPL)**
  - Navigate to "Assess a Company or Ticker"
  - Enter ticker: AAPL
  - Run assessment
  - **Verify PP&E "Other countries" allocated correctly**
    - Expected: ~11.9% allocation using RF-B
    - Check trace log for: "RF-B applied to 'Other countries' label"
  - **Verify Revenue still works correctly (no regression)**
    - Expected: Japan (DIRECT) + 4 segment labels (SSF)
    - No RF should fire (all labels resolvable)
  - **Verify Supply Chain still works correctly (no regression)**
    - Expected: RF-B for 100% of channel
    - Named countries in restricted set

- ⏳ **Test with Tesla (TSLA)**
  - Navigate to "Assess a Company or Ticker"
  - Enter ticker: TSLA
  - Run assessment
  - **Verify "Other regions" allocated correctly**
    - Expected: ~30% allocation using RF-B or RF-C
    - Check trace log for RF type used

- ⏳ **Test with Microsoft (MSFT)**
  - Navigate to "Assess a Company or Ticker"
  - Enter ticker: MSFT
  - Run assessment
  - **Verify "Rest of world" allocated correctly**
    - Expected: Allocation using RF-B/C/D
    - Check trace log for RF type used

### Monitor Staging Logs

- ⏳ **Monitor console logs for 24-48 hours**
  - Watch for trace log entries:
    ```
    [V4 Orchestrator] STEP2: closed allocatable label totals detected
    [V4 Orchestrator] Label "Other countries": RF-B applied (residual only)
    [V4 Orchestrator] Restricted Set P: {Vietnam, India, Mexico, ...}
    [V4 Orchestrator] END: direct + SSF + RF-B merged and normalized
    ```

- ⏳ **Monitor validation warnings**
  - Watch for CRITICAL warnings (should be rare):
    ```
    [Evidence Validation] 🔴 CRITICAL: Cross-channel contamination detected
    ```
  - Watch for HIGH warnings (should be low):
    ```
    [Evidence Validation] 🟠 HIGH: Revenue has no segment labels
    ```
  - MEDIUM/LOW warnings are acceptable

- ⏳ **Track allocation accuracy metrics**
  - % of companies with all exposure accounted for
  - % of residual labels allocated correctly
  - RF type distribution (RF-A, RF-B, RF-C, RF-D)

### Staging Validation

- ⏳ **Verify no CRITICAL warnings**
  - Target: <1% of companies with CRITICAL warnings
  - Action: Investigate any CRITICAL warnings

- ⏳ **Verify allocation accuracy improved**
  - Target: >95% of companies with all exposure accounted for
  - Measurement: Final weights sum to ~1.0

- ⏳ **Verify no regression**
  - Apple Revenue: Still uses SSF correctly
  - Apple Supply Chain: Still uses RF-B correctly
  - Simple cases: Still work correctly

- ⏳ **Verify RF-B/C/D usage increased**
  - Target: >60% of residual labels use RF-B/C/D
  - Measurement: RF type distribution

---

## Production Deployment

### Pre-Production Checklist

- ⏳ **Staging validation complete**
  - All test cases passed
  - No CRITICAL warnings
  - Allocation accuracy improved
  - No regression detected

- ⏳ **Stakeholder approval**
  - Product owner approval
  - Technical lead approval
  - QA approval

- ⏳ **Rollback plan confirmed**
  - Rollback procedure documented
  - Rollback time: <10 minutes
  - Rollback criteria defined

### Deploy to Production

- ⏳ **Build production bundle**
  ```bash
  cd /workspace/shadcn-ui
  pnpm run build
  ```

- ⏳ **Deploy to production environment**
  ```bash
  # Deployment commands specific to production environment
  # Example:
  # aws s3 sync dist/ s3://production-bucket/
  # aws cloudfront create-invalidation --distribution-id PROD_DIST_ID --paths "/*"
  ```

- ⏳ **Verify deployment**
  - Check production URL loads correctly
  - Check console for errors
  - Check build version matches

### Post-Deployment Validation

- ⏳ **Smoke test**
  - Test with Apple (AAPL)
  - Verify PP&E "Other countries" allocated correctly
  - Verify Revenue still works correctly
  - Verify Supply Chain still works correctly

- ⏳ **Monitor production logs for 24-48 hours**
  - Watch for trace log entries
  - Watch for validation warnings
  - Track allocation accuracy metrics

- ⏳ **Review user feedback**
  - Monitor support tickets
  - Review user reports
  - Track satisfaction metrics

---

## Monitoring Setup

### Console Logging

**Trace Log Entries to Watch:**
```javascript
[V4 Orchestrator] STEP0: evidence extracted (structured + narrative + supplementary hints)
[V4 Orchestrator] STEP1: direct country-level structured evidence allocated + locked
[V4 Orchestrator] STEP2: closed allocatable label totals detected => label-by-label allocation
[V4 Orchestrator] Label "Other countries": RF-B applied (residual only)
[V4 Orchestrator] Restricted Set P: {Vietnam, India, Mexico, ...}
[V4 Orchestrator] END: direct + SSF + RF-B merged and normalized
```

**Validation Warnings to Watch:**
```javascript
// CRITICAL (immediate action required)
[Evidence Validation] 🔴 CRITICAL (1):
  [contamination] Revenue channel has structured item with ASSETS source reference

// HIGH (review required)
[Evidence Validation] 🟠 HIGH (1):
  [completeness] Revenue channel has no segment labels (GEO_LABEL), only countries

// MEDIUM/LOW (monitor)
[Evidence Validation] 🟡 MEDIUM (1):
  [confidence] Definition has low confidence (<0.5)
```

### Metrics to Track

**1. Allocation Accuracy**
- % of companies with all exposure accounted for
- % of companies with final weights summing to ~1.0
- Average missing exposure per company

**Tracking:**
```javascript
// Daily metrics
const allocationAccuracy = {
  totalCompanies: 1000,
  companiesWithFullAllocation: 950,
  accuracyRate: 0.95 // Target: >0.95
};
```

**2. Residual Label Coverage**
- % of residual labels allocated correctly
- % of residual labels using RF-B/C/D (not zero)

**Tracking:**
```javascript
// Daily metrics
const residualLabelCoverage = {
  totalResidualLabels: 200,
  labelsAllocatedCorrectly: 180,
  coverageRate: 0.90 // Target: >0.90
};
```

**3. RF Type Distribution**
- % of labels using RF-A
- % of labels using RF-B
- % of labels using RF-C
- % of labels using RF-D

**Tracking:**
```javascript
// Daily metrics
const rfTypeDistribution = {
  RF_A: 0.10, // Conservative, no evidence
  RF_B: 0.60, // Named countries (should increase)
  RF_C: 0.20, // Geo labels (should increase)
  RF_D: 0.10  // Partial structured (should increase)
};
```

**4. Validation Pass Rate**
- % of companies with no CRITICAL warnings
- % of companies with no HIGH warnings
- Warning distribution by severity

**Tracking:**
```javascript
// Daily metrics
const validationPassRate = {
  totalCompanies: 1000,
  companiesWithNoCritical: 990,
  companiesWithNoHigh: 950,
  criticalRate: 0.01, // Target: <0.01
  highRate: 0.05      // Target: <0.10
};
```

### Alerting

**CRITICAL Alerts (Immediate Action):**
- CRITICAL warnings >1% of companies
- Allocation accuracy <90%
- System errors or crashes
- User-reported issues with incorrect results

**HIGH Alerts (Review Required):**
- HIGH warnings >10% of companies
- Allocation accuracy <95%
- Residual label coverage <80%
- Unexpected RF type distribution

**MEDIUM Alerts (Monitor):**
- MEDIUM warnings >20% of companies
- Allocation accuracy <98%
- Residual label coverage <90%

---

## Rollback Plan

### Rollback Criteria

**Rollback if:**
- ❌ CRITICAL warnings for >10% of companies
- ❌ Allocation results significantly different from expected
- ❌ System errors or crashes
- ❌ User-reported issues with incorrect results

**Do NOT rollback if:**
- ✅ Only LOW/MEDIUM warnings (expected during transition)
- ✅ Warnings are accurate and helpful
- ✅ Allocation results improved
- ✅ No user-facing issues

### Rollback Procedure

**Step 1: Identify the Issue**
```bash
# Check console logs for errors
# Review validation reports
# Identify affected companies
```

**Step 2: Assess Impact**
- Determine if issue affects allocation accuracy
- Check if issue is systematic or isolated
- Evaluate urgency of rollback

**Step 3: Execute Rollback**
```bash
cd /workspace/shadcn-ui

# Revert v4Orchestrator.ts to previous version
git checkout HEAD~1 src/services/v4/v4Orchestrator.ts

# Revert rfTaxonomy.ts to previous version
git checkout HEAD~1 src/services/v4/rfTaxonomy.ts

# Rebuild
pnpm run build

# Redeploy to production
# (deployment commands specific to environment)
```

**Step 4: Investigate and Fix**
- Analyze root cause
- Create fix in development environment
- Test thoroughly
- Redeploy when ready

**Rollback Time:** <10 minutes

---

## Success Metrics

### Phase 1: Staging (24-48 hours)

- ⏳ **All test cases pass**
  - Apple PP&E "Other countries" allocated correctly
  - Tesla "Other regions" allocated correctly
  - Microsoft "Rest of world" allocated correctly

- ⏳ **No CRITICAL validation warnings**
  - Target: <1% of companies

- ⏳ **No regression in simple cases**
  - Apple Revenue: Still uses SSF correctly
  - Apple Supply Chain: Still uses RF-B correctly

### Phase 2: Production (1 week)

- ⏳ **Allocation accuracy >95%**
  - % of companies with all exposure accounted for

- ⏳ **Residual label coverage >90%**
  - % of residual labels allocated correctly

- ⏳ **RF-B/C/D usage increases**
  - Target: >60% of residual labels use RF-B/C/D

- ⏳ **No user-reported issues**
  - Monitor support tickets
  - Review user feedback

- ⏳ **No system errors**
  - Monitor error logs
  - Track error rates

### Phase 3: Long-Term (1 month)

- ⏳ **Sustained allocation accuracy >95%**
  - Track daily metrics
  - Review weekly trends

- ⏳ **Validation pass rate >90%**
  - % of companies with no CRITICAL warnings

- ⏳ **Positive user feedback**
  - User satisfaction surveys
  - Support ticket reduction

- ⏳ **No edge cases discovered**
  - Monitor for unexpected behavior
  - Document any edge cases

---

## Post-Deployment Tasks

### Documentation

- ⏳ **Update production deployment report**
  - Document actual deployment date/time
  - Document test results
  - Document any issues encountered

- ⏳ **Document edge cases discovered**
  - Create issue tickets
  - Update decision tree documentation
  - Add test cases

- ⏳ **Update user documentation**
  - Update FAQs
  - Update troubleshooting guide
  - Update examples

### Review

- ⏳ **Weekly metrics review**
  - Review allocation accuracy
  - Review RF type distribution
  - Review validation pass rate

- ⏳ **Monthly retrospective**
  - What went well?
  - What could be improved?
  - Lessons learned

- ⏳ **Continuous improvement**
  - Identify optimization opportunities
  - Plan next iteration
  - Update roadmap

---

## Checklist Summary

### Pre-Deployment
- ✅ Code changes implemented
- ✅ Build successful (0 errors)
- ✅ Test suite created (11 test cases)
- ✅ Documentation created
- ✅ Risk assessment: LOW

### Staging Deployment
- ⏳ Deploy to staging
- ⏳ Test with Apple, Tesla, Microsoft
- ⏳ Monitor logs for 24-48 hours
- ⏳ Verify no CRITICAL warnings
- ⏳ Verify allocation accuracy improved

### Production Deployment
- ⏳ Staging validation complete
- ⏳ Stakeholder approval
- ⏳ Deploy to production
- ⏳ Smoke test
- ⏳ Monitor logs for 24-48 hours

### Post-Deployment
- ⏳ Track success metrics
- ⏳ Review user feedback
- ⏳ Document edge cases
- ⏳ Weekly metrics review
- ⏳ Monthly retrospective

---

**Prepared By:** Alex (Engineer)  
**Date:** January 6, 2026  
**Status:** ✅ READY FOR STAGING DEPLOYMENT  
**Next Step:** Deploy to staging and test with real company data