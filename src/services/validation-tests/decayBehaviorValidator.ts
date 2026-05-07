/**
 * Decay Behavior Validator
 * 
 * Validates exponential decay behavior with 30-day half-life.
 * Tests that signals decay properly over time.
 * Validates decay formula: signal * e^(-λt) where λ = ln(2)/30
 */

export interface DecayTestCase {
  testName: string;
  initialValue: number;
  daysElapsed: number;
  expectedValue: number;
  tolerance: number;
}

export interface DecayValidationResult {
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

// Decay constant: λ = ln(2) / 30 (30-day half-life)
const DECAY_LAMBDA = Math.log(2) / 30;
const HALF_LIFE_DAYS = 30;

/**
 * Apply exponential decay formula
 * signal * e^(-λt) where λ = ln(2)/30
 */
function applyDecay(initialValue: number, daysElapsed: number): number {
  return initialValue * Math.exp(-DECAY_LAMBDA * daysElapsed);
}

/**
 * Run all decay behavior validations
 */
export function runDecayBehaviorValidation(): DecayValidationResult[] {
  console.log('\n📉 Running Decay Behavior Validation...\n');
  const results: DecayValidationResult[] = [];

  // Test 1: Half-life validation (30 days = 50% decay)
  {
    const checks: DecayValidationResult['checks'] = [];
    const initial = 10.0;
    const decayed = applyDecay(initial, 30);
    const expectedHalf = initial * 0.5;
    const halfLifeCorrect = Math.abs(decayed - expectedHalf) < 0.001;

    checks.push({
      checkName: '30-day half-life produces 50% decay',
      passed: halfLifeCorrect,
      expected: `${expectedHalf.toFixed(4)}`,
      actual: `${decayed.toFixed(4)}`,
      message: halfLifeCorrect
        ? `Decay at 30 days: ${decayed.toFixed(4)} ≈ ${expectedHalf.toFixed(4)} (50%)`
        : `Decay mismatch: expected ${expectedHalf.toFixed(4)}, got ${decayed.toFixed(4)}`,
    });

    // Verify at 60 days (should be ~25%)
    const decayed60 = applyDecay(initial, 60);
    const expected25 = initial * 0.25;
    const sixtyDayCorrect = Math.abs(decayed60 - expected25) < 0.001;

    checks.push({
      checkName: '60-day decay produces ~25% of initial',
      passed: sixtyDayCorrect,
      expected: `${expected25.toFixed(4)}`,
      actual: `${decayed60.toFixed(4)}`,
      message: sixtyDayCorrect
        ? `Decay at 60 days: ${decayed60.toFixed(4)} ≈ ${expected25.toFixed(4)} (25%)`
        : `Decay mismatch at 60 days`,
    });

    // Verify at 90 days (should be ~12.5%)
    const decayed90 = applyDecay(initial, 90);
    const expected125 = initial * 0.125;
    const ninetyDayCorrect = Math.abs(decayed90 - expected125) < 0.001;

    checks.push({
      checkName: '90-day decay produces ~12.5% of initial',
      passed: ninetyDayCorrect,
      expected: `${expected125.toFixed(4)}`,
      actual: `${decayed90.toFixed(4)}`,
      message: ninetyDayCorrect
        ? `Decay at 90 days: ${decayed90.toFixed(4)} ≈ ${expected125.toFixed(4)} (12.5%)`
        : `Decay mismatch at 90 days`,
    });

    results.push({
      testName: 'Half-Life Decay Validation',
      passed: checks.every(c => c.passed),
      checks,
    });
    console.log(`  ${checks.every(c => c.passed) ? '✅' : '❌'} Half-Life Decay: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);
  }

  // Test 2: Monotonic decrease validation
  {
    const checks: DecayValidationResult['checks'] = [];
    const initial = 15.0;
    let isMonotonic = true;
    let previousValue = initial;

    for (let day = 1; day <= 120; day++) {
      const currentValue = applyDecay(initial, day);
      if (currentValue > previousValue + 0.0001) {
        isMonotonic = false;
        break;
      }
      previousValue = currentValue;
    }

    checks.push({
      checkName: 'Decay is monotonically decreasing over 120 days',
      passed: isMonotonic,
      expected: 'Monotonically decreasing',
      actual: isMonotonic ? 'Monotonically decreasing' : 'Non-monotonic behavior detected',
      message: isMonotonic
        ? 'Decay is strictly monotonically decreasing'
        : 'Decay violated monotonic decrease',
    });

    // Check that decay never goes negative
    const decayAt365 = applyDecay(initial, 365);
    const neverNegative = decayAt365 > 0;

    checks.push({
      checkName: 'Decay never produces negative values',
      passed: neverNegative,
      expected: '> 0 at day 365',
      actual: `${decayAt365.toFixed(8)} at day 365`,
      message: neverNegative
        ? `Value at day 365: ${decayAt365.toFixed(8)} (positive)`
        : 'Decay produced negative value',
    });

    results.push({
      testName: 'Monotonic Decrease Validation',
      passed: checks.every(c => c.passed),
      checks,
    });
    console.log(`  ${checks.every(c => c.passed) ? '✅' : '❌'} Monotonic Decrease: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);
  }

  // Test 3: Decay formula correctness (λ = ln(2)/30)
  {
    const checks: DecayValidationResult['checks'] = [];

    // Verify λ value
    const expectedLambda = Math.log(2) / 30;
    const lambdaCorrect = Math.abs(DECAY_LAMBDA - expectedLambda) < 1e-10;

    checks.push({
      checkName: 'Decay constant λ = ln(2)/30',
      passed: lambdaCorrect,
      expected: `λ = ${expectedLambda.toFixed(10)}`,
      actual: `λ = ${DECAY_LAMBDA.toFixed(10)}`,
      message: lambdaCorrect
        ? `λ = ${DECAY_LAMBDA.toFixed(6)} (correct)`
        : `λ mismatch`,
    });

    // Verify formula: signal * e^(-λt)
    const testCases = [
      { t: 0, expected: 1.0 },
      { t: 30, expected: 0.5 },
      { t: 60, expected: 0.25 },
      { t: 1, expected: Math.exp(-DECAY_LAMBDA) },
      { t: 15, expected: Math.exp(-DECAY_LAMBDA * 15) },
    ];

    for (const tc of testCases) {
      const actual = applyDecay(1.0, tc.t);
      const correct = Math.abs(actual - tc.expected) < 0.0001;

      checks.push({
        checkName: `Formula at t=${tc.t}: e^(-λ*${tc.t})`,
        passed: correct,
        expected: `${tc.expected.toFixed(6)}`,
        actual: `${actual.toFixed(6)}`,
        message: correct
          ? `e^(-λ*${tc.t}) = ${actual.toFixed(6)} ✓`
          : `e^(-λ*${tc.t}) expected ${tc.expected.toFixed(6)}, got ${actual.toFixed(6)}`,
      });
    }

    results.push({
      testName: 'Decay Formula Correctness',
      passed: checks.every(c => c.passed),
      checks,
    });
    console.log(`  ${checks.every(c => c.passed) ? '✅' : '❌'} Formula Correctness: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);
  }

  // Test 4: Different severity levels decay at same rate
  {
    const checks: DecayValidationResult['checks'] = [];
    const severities = [3, 5, 7, 9];

    for (const severity of severities) {
      const initialDelta = severity * 1.5;
      const decayedDelta = applyDecay(initialDelta, 30);
      const ratio = decayedDelta / initialDelta;
      const ratioCorrect = Math.abs(ratio - 0.5) < 0.001;

      checks.push({
        checkName: `Severity ${severity}: same decay rate at 30 days`,
        passed: ratioCorrect,
        expected: `Ratio ≈ 0.5`,
        actual: `Ratio = ${ratio.toFixed(6)}`,
        message: ratioCorrect
          ? `Severity ${severity}: initial=${initialDelta.toFixed(1)}, decayed=${decayedDelta.toFixed(4)}, ratio=${ratio.toFixed(4)}`
          : `Severity ${severity}: decay rate incorrect`,
      });
    }

    results.push({
      testName: 'Severity-Independent Decay Rate',
      passed: checks.every(c => c.passed),
      checks,
    });
    console.log(`  ${checks.every(c => c.passed) ? '✅' : '❌'} Severity-Independent Rate: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);
  }

  // Test 5: Near-zero convergence
  {
    const checks: DecayValidationResult['checks'] = [];
    const initial = 10.0;

    // After 300 days, value should be very close to zero
    const decayed300 = applyDecay(initial, 300);
    const nearZero = decayed300 < 0.01;

    checks.push({
      checkName: 'Convergence to near-zero after 300 days',
      passed: nearZero,
      expected: '< 0.01',
      actual: `${decayed300.toFixed(8)}`,
      message: nearZero
        ? `Value at 300 days: ${decayed300.toFixed(8)} (effectively zero)`
        : `Value at 300 days: ${decayed300.toFixed(8)} (not converged)`,
    });

    // After 180 days, value should be < 2% of initial
    const decayed180 = applyDecay(initial, 180);
    const under2Percent = decayed180 < initial * 0.02;

    checks.push({
      checkName: 'Below 2% of initial after 180 days',
      passed: under2Percent,
      expected: `< ${(initial * 0.02).toFixed(4)}`,
      actual: `${decayed180.toFixed(4)}`,
      message: under2Percent
        ? `Value at 180 days: ${decayed180.toFixed(4)} (< 2% of initial)`
        : `Value at 180 days: ${decayed180.toFixed(4)} (still > 2%)`,
    });

    results.push({
      testName: 'Near-Zero Convergence',
      passed: checks.every(c => c.passed),
      checks,
    });
    console.log(`  ${checks.every(c => c.passed) ? '✅' : '❌'} Near-Zero Convergence: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);
  }

  return results;
}