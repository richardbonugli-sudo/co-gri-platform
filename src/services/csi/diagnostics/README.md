# CSI Diagnostic and Testing Suite

This directory contains comprehensive diagnostic and testing tools for the CSI (Country Shock Index) system.

## Overview

The diagnostic suite helps identify and fix issues with CSI responsiveness, ensuring that geopolitical events are correctly reflected in dashboard displays.

## Files

### 1. CSIDiagnosticService.ts
**Purpose:** Core diagnostic service that analyzes CSI system health and identifies data flow issues.

**Key Features:**
- System health checks
- Detection pipeline analysis
- Data flow validation
- Country-specific CSI analysis
- Automated recommendations

**Usage:**
```typescript
import { csiDiagnosticService } from './CSIDiagnosticService';

// Run diagnostic for all countries
const report = await csiDiagnosticService.runDiagnostic();

// Run diagnostic for specific countries
const report = await csiDiagnosticService.runDiagnostic(['United States', 'Iran', 'Iraq']);

// Print report to console
csiDiagnosticService.printReport(report);
```

### 2. testCSIIntegration.ts
**Purpose:** Integration testing suite that validates end-to-end CSI functionality.

**Test Coverage:**
- Baseline Manager initialization
- Event storage and retrieval
- Composite CSI calculation
- Dashboard data flow
- Event-driven updates
- Multi-country validation

**Usage:**
```typescript
import { runCSIIntegrationTests } from './testCSIIntegration';

// Run all integration tests
const report = await runCSIIntegrationTests();
```

### 3. validationReport.ts
**Purpose:** Generates comprehensive validation reports combining diagnostics and tests.

**Report Types:**
- **Full Report:** Complete diagnostic + integration tests
- **Quick Report:** Diagnostic only (faster)
- **Country-Specific:** Focused analysis for specific countries

**Usage:**
```typescript
import { runFullValidation, runQuickValidation, runCountryValidation } from './validationReport';

// Full validation (diagnostic + tests)
const fullReport = await runFullValidation();

// Quick validation (diagnostic only)
const quickReport = await runQuickValidation();

// Country-specific validation
const countryReport = await runCountryValidation(['United States', 'Iran']);
```

### 4. browserTestRunner.ts
**Purpose:** Browser console interface for running tests in development.

**Usage in Browser Console:**
```javascript
// Available commands (automatically loaded)
window.csiTests.runBrowserTests()           // Run all tests
window.csiTests.runQuickDiagnostic()        // Quick diagnostic
window.csiTests.runQuickValidation()        // Quick validation
window.csiTests.runFullValidation()         // Full validation
window.csiTests.testCountries(['US', 'Iran']) // Test specific countries
```

## Common Issues and Solutions

### Issue 1: Dashboard displays static baseline CSI instead of event-driven values

**Root Cause:** Dashboard components read CSI directly from GLOBAL_COUNTRIES array instead of calling composite calculator.

**Solution:** Update components to use `getCountryShockIndex()` or `getCountryCSIDetails()` from `globalCountries.ts`.

**Example Fix:**
```typescript
// ❌ WRONG - Reads static baseline
const csi = GLOBAL_COUNTRIES.find(c => c.country === 'Iran')?.csi;

// ✅ CORRECT - Gets composite CSI (baseline + events)
const csi = getCountryShockIndex('Iran');
```

### Issue 2: Events not affecting CSI values

**Symptoms:**
- Events are created and stored
- Events show in event panels
- CSI values don't change

**Diagnosis:**
```typescript
const report = await csiDiagnosticService.runDiagnostic(['Iran']);
console.log(report.countryAnalysis);
// Check: displayedCSI vs compositeCSI
```

**Solution:** Ensure event state is 'CONFIRMED' (only confirmed events affect CSI).

### Issue 3: CSI calculation discrepancies

**Symptoms:**
- Composite CSI ≠ Baseline CSI + Event CSI

**Diagnosis:**
```typescript
const report = await runCSIIntegrationTests();
// Check: Test 6 - Multi-Country Validation
```

**Solution:** Review decay schedule configuration and event effective dates.

## Validation Workflow

### Step 1: Quick Health Check
```typescript
const report = await runQuickValidation();
// Review system status and critical issues
```

### Step 2: Run Integration Tests
```typescript
const testReport = await runCSIIntegrationTests();
// Verify all tests pass
```

### Step 3: Country-Specific Analysis
```typescript
const countryReport = await runCountryValidation([
  'United States', 'Iran', 'Iraq', 'Israel'
]);
// Analyze affected countries
```

### Step 4: Implement Fixes
Based on recommendations in validation reports.

### Step 5: Re-validate
```typescript
const finalReport = await runFullValidation();
// Confirm all issues resolved
```

## Report Interpretation

### System Health Status
- **Healthy:** All systems operational, no critical issues
- **Degraded:** Some issues detected, requires attention
- **Critical:** Immediate action required

### Test Status
- **PASS:** All tests passed, system functioning correctly
- **FAIL:** One or more tests failed, review details

### Country Analysis Status
- **correct:** CSI displayed correctly
- **incorrect:** Significant discrepancy (>5 points)
- **missing_events:** Events exist but not reflected in CSI

## Best Practices

1. **Run diagnostics after any CSI-related changes**
2. **Use quick validation for rapid feedback**
3. **Run full validation before deployments**
4. **Test affected countries specifically when investigating issues**
5. **Keep diagnostic reports for historical tracking**

## Troubleshooting

### Tests fail with "No baseline found"
**Solution:** Ensure `initializeBaselines()` is called on app startup.

### Tests fail with "Event not found"
**Solution:** Check event creation and storage logic.

### Composite CSI calculation errors
**Solution:** Verify baseline manager and event store are initialized.

### Dashboard still shows old values
**Solution:** Clear browser cache and restart dev server.

## Integration with CI/CD

```typescript
// Add to test suite
import { runCSIIntegrationTests } from '@/services/csi/diagnostics/testCSIIntegration';

describe('CSI System Integration', () => {
  it('should pass all integration tests', async () => {
    const report = await runCSIIntegrationTests();
    expect(report.overallStatus).toBe('PASS');
    expect(report.failedTests).toBe(0);
  });
});
```

## Support

For issues or questions:
1. Run full diagnostic: `runFullValidation()`
2. Review diagnostic report recommendations
3. Check this README for common issues
4. Review code comments in diagnostic services

## Version History

- **v1.0.0** - Initial diagnostic suite
  - CSIDiagnosticService
  - Integration tests
  - Validation reports
  - Browser test runner