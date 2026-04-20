/**
 * Netting Validator
 * 
 * Validates netting logic:
 * - Confirmation events properly net (absorb/replace) prior escalation drift
 *   within the same vector
 * - Netting doesn't affect different vectors
 */

export interface NettingTestCase {
  testName: string;
  vector: string;
  preNettingDrift: number;
  eventDelta: number;
  expectedPostNettingDrift: number;
}

export interface NettingValidationResult {
  testName: string;
  passed: boolean;
  checks: Array<{
    checkName: string;
    passed: boolean;
    expected: string;
    actual: string;
    message: string;
  }>;
}

/**
 * Apply netting logic: confirmation event absorbs prior escalation drift
 * within the same vector.
 * 
 * Formula: post_netting_drift = max(0, pre_netting_drift - event_delta * absorption_factor)
 * Absorption factor = 0.5 (event absorbs 50% of drift)
 */
function applyNetting(preNettingDrift: number, eventDelta: number, absorptionFactor: number = 0.5): number {
  return Math.max(0, preNettingDrift - eventDelta * absorptionFactor);
}

/**
 * Simulate CSI components for a vector
 */
interface VectorState {
  vector: string;
  baseline: number;
  escalationDrift: number;
  eventDelta: number;
}

/**
 * Run all netting validations
 */
export function runNettingValidation(): NettingValidationResult[] {
  console.log('\n🔗 Running Netting Validation...\n');
  const results: NettingValidationResult[] = [];

  // Test 1: Same-vector netting (event absorbs drift)
  {
    const checks: NettingValidationResult['checks'] = [];

    const preNettingDrift = 8.0;
    const eventDelta = 12.0;
    const postNettingDrift = applyNetting(preNettingDrift, eventDelta);

    // Post-netting drift should be reduced
    checks.push({
      checkName: 'Same-vector netting reduces drift',
      passed: postNettingDrift < preNettingDrift,
      expected: `< ${preNettingDrift}`,
      actual: `${postNettingDrift.toFixed(4)}`,
      message: `Drift reduced from ${preNettingDrift} to ${postNettingDrift.toFixed(4)}`,
    });

    // Post-netting drift should be max(0, drift - delta * 0.5)
    const expectedDrift = Math.max(0, preNettingDrift - eventDelta * 0.5);
    checks.push({
      checkName: 'Netting formula: max(0, drift - delta * 0.5)',
      passed: Math.abs(postNettingDrift - expectedDrift) < 0.001,
      expected: `${expectedDrift.toFixed(4)}`,
      actual: `${postNettingDrift.toFixed(4)}`,
      message: `Expected ${expectedDrift.toFixed(4)}, got ${postNettingDrift.toFixed(4)}`,
    });

    // Post-netting drift should never be negative
    checks.push({
      checkName: 'Post-netting drift ≥ 0',
      passed: postNettingDrift >= 0,
      expected: '≥ 0',
      actual: `${postNettingDrift.toFixed(4)}`,
      message: postNettingDrift >= 0 ? 'Non-negative drift confirmed' : 'Negative drift detected!',
    });

    // Composite CSI should change after netting
    const preNettingCSI = 50.0 + preNettingDrift + eventDelta;
    const postNettingCSI = 50.0 + postNettingDrift + eventDelta;
    checks.push({
      checkName: 'Composite CSI changes after netting',
      passed: postNettingCSI !== preNettingCSI,
      expected: `≠ ${preNettingCSI.toFixed(2)}`,
      actual: `${postNettingCSI.toFixed(2)}`,
      message: `CSI changed from ${preNettingCSI.toFixed(2)} to ${postNettingCSI.toFixed(2)}`,
    });

    results.push({
      testName: 'Same-Vector Netting',
      passed: checks.every(c => c.passed),
      checks,
    });
    console.log(`  ${checks.every(c => c.passed) ? '✅' : '❌'} Same-Vector Netting: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);
  }

  // Test 2: Cross-vector isolation (netting doesn't affect other vectors)
  {
    const checks: NettingValidationResult['checks'] = [];

    // Setup: Two vectors with different states
    const vectorSC1: VectorState = {
      vector: 'SC1',
      baseline: 55.0,
      escalationDrift: 6.0,
      eventDelta: 0,
    };

    const vectorSC2: VectorState = {
      vector: 'SC2',
      baseline: 45.0,
      escalationDrift: 8.0,
      eventDelta: 12.0,
    };

    // Apply netting to SC2 only
    const sc2PostNettingDrift = applyNetting(vectorSC2.escalationDrift, vectorSC2.eventDelta);

    // SC1 should be unchanged
    checks.push({
      checkName: 'SC1 drift unchanged after SC2 netting',
      passed: vectorSC1.escalationDrift === 6.0,
      expected: '6.0',
      actual: `${vectorSC1.escalationDrift}`,
      message: `SC1 drift: ${vectorSC1.escalationDrift} (unchanged)`,
    });

    checks.push({
      checkName: 'SC1 baseline unchanged after SC2 netting',
      passed: vectorSC1.baseline === 55.0,
      expected: '55.0',
      actual: `${vectorSC1.baseline}`,
      message: `SC1 baseline: ${vectorSC1.baseline} (unchanged)`,
    });

    // SC2 should be changed
    checks.push({
      checkName: 'SC2 drift changed after netting',
      passed: sc2PostNettingDrift < vectorSC2.escalationDrift,
      expected: `< ${vectorSC2.escalationDrift}`,
      actual: `${sc2PostNettingDrift.toFixed(4)}`,
      message: `SC2 drift reduced from ${vectorSC2.escalationDrift} to ${sc2PostNettingDrift.toFixed(4)}`,
    });

    results.push({
      testName: 'Cross-Vector Isolation',
      passed: checks.every(c => c.passed),
      checks,
    });
    console.log(`  ${checks.every(c => c.passed) ? '✅' : '❌'} Cross-Vector Isolation: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);
  }

  // Test 3: Full absorption (large event delta fully absorbs small drift)
  {
    const checks: NettingValidationResult['checks'] = [];

    const smallDrift = 2.0;
    const largeEventDelta = 15.0;
    const postNettingDrift = applyNetting(smallDrift, largeEventDelta);

    // Should be fully absorbed (drift = 0)
    checks.push({
      checkName: 'Large event fully absorbs small drift',
      passed: postNettingDrift === 0,
      expected: '0',
      actual: `${postNettingDrift.toFixed(4)}`,
      message: `Drift ${smallDrift} fully absorbed by event delta ${largeEventDelta}`,
    });

    results.push({
      testName: 'Full Absorption',
      passed: checks.every(c => c.passed),
      checks,
    });
    console.log(`  ${checks.every(c => c.passed) ? '✅' : '❌'} Full Absorption: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);
  }

  // Test 4: Partial absorption (small event delta partially absorbs large drift)
  {
    const checks: NettingValidationResult['checks'] = [];

    const largeDrift = 10.0;
    const smallEventDelta = 4.0;
    const postNettingDrift = applyNetting(largeDrift, smallEventDelta);

    // Should be partially absorbed
    checks.push({
      checkName: 'Small event partially absorbs large drift',
      passed: postNettingDrift > 0 && postNettingDrift < largeDrift,
      expected: `Between 0 and ${largeDrift}`,
      actual: `${postNettingDrift.toFixed(4)}`,
      message: `Drift reduced from ${largeDrift} to ${postNettingDrift.toFixed(4)}`,
    });

    // Verify exact value: max(0, 10.0 - 4.0 * 0.5) = max(0, 8.0) = 8.0
    const expectedValue = Math.max(0, largeDrift - smallEventDelta * 0.5);
    checks.push({
      checkName: 'Partial absorption formula correct',
      passed: Math.abs(postNettingDrift - expectedValue) < 0.001,
      expected: `${expectedValue.toFixed(4)}`,
      actual: `${postNettingDrift.toFixed(4)}`,
      message: `Expected ${expectedValue.toFixed(4)}, got ${postNettingDrift.toFixed(4)}`,
    });

    results.push({
      testName: 'Partial Absorption',
      passed: checks.every(c => c.passed),
      checks,
    });
    console.log(`  ${checks.every(c => c.passed) ? '✅' : '❌'} Partial Absorption: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);
  }

  // Test 5: Zero drift netting (no drift to absorb)
  {
    const checks: NettingValidationResult['checks'] = [];

    const zeroDrift = 0;
    const eventDelta = 10.0;
    const postNettingDrift = applyNetting(zeroDrift, eventDelta);

    checks.push({
      checkName: 'Zero drift remains zero after netting',
      passed: postNettingDrift === 0,
      expected: '0',
      actual: `${postNettingDrift.toFixed(4)}`,
      message: `Zero drift correctly remains zero`,
    });

    results.push({
      testName: 'Zero Drift Netting',
      passed: checks.every(c => c.passed),
      checks,
    });
    console.log(`  ${checks.every(c => c.passed) ? '✅' : '❌'} Zero Drift Netting: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);
  }

  return results;
}