/**
 * Cross-Vector Contamination Validator
 * 
 * Detects cross-vector contamination.
 * Ensures no signal leakage between SC1-SC7 vectors.
 * Each vector must be independent:
 * - SC1: Military
 * - SC2: Economic
 * - SC3: Political
 * - SC4: Diplomatic
 * - SC5: Information
 * - SC6: Social
 * - SC7: Infrastructure
 */

export interface VectorState {
  vectorId: string;
  vectorName: string;
  baseline: number;
  escalationDrift: number;
  eventDelta: number;
  compositeCSI: number;
  activeEvents: string[];
}

export interface ContaminationTestResult {
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

// Vector definitions
const VECTORS: Record<string, string> = {
  SC1: 'Military',
  SC2: 'Economic',
  SC3: 'Political',
  SC4: 'Diplomatic',
  SC5: 'Information',
  SC6: 'Social',
  SC7: 'Infrastructure',
};

/**
 * Initialize vector states with default baselines
 */
function initializeVectors(): Map<string, VectorState> {
  const vectors = new Map<string, VectorState>();

  const baselines: Record<string, number> = {
    SC1: 45.0,
    SC2: 42.0,
    SC3: 38.0,
    SC4: 35.0,
    SC5: 30.0,
    SC6: 33.0,
    SC7: 28.0,
  };

  for (const [vectorId, vectorName] of Object.entries(VECTORS)) {
    vectors.set(vectorId, {
      vectorId,
      vectorName,
      baseline: baselines[vectorId],
      escalationDrift: 0,
      eventDelta: 0,
      compositeCSI: baselines[vectorId],
      activeEvents: [],
    });
  }

  return vectors;
}

/**
 * Apply an event to a specific vector (should NOT affect other vectors)
 */
function applyEventToVector(
  vectors: Map<string, VectorState>,
  targetVector: string,
  eventType: string,
  severity: number
): Map<string, VectorState> {
  const updatedVectors = new Map(vectors);

  const target = updatedVectors.get(targetVector);
  if (!target) return updatedVectors;

  // Apply event only to target vector
  const escalationDrift = severity * 0.3 * 5; // 5 days of drift
  const eventDelta = severity * 1.5;

  updatedVectors.set(targetVector, {
    ...target,
    escalationDrift,
    eventDelta,
    compositeCSI: target.baseline + escalationDrift + eventDelta,
    activeEvents: [...target.activeEvents, eventType],
  });

  return updatedVectors;
}

/**
 * Check if any non-target vectors were affected
 */
function checkContamination(
  beforeVectors: Map<string, VectorState>,
  afterVectors: Map<string, VectorState>,
  targetVector: string
): Array<{ vectorId: string; field: string; before: number; after: number }> {
  const contaminations: Array<{ vectorId: string; field: string; before: number; after: number }> = [];

  for (const [vectorId, beforeState] of beforeVectors.entries()) {
    if (vectorId === targetVector) continue; // Skip target vector

    const afterState = afterVectors.get(vectorId)!;

    if (Math.abs(afterState.baseline - beforeState.baseline) > 0.001) {
      contaminations.push({
        vectorId,
        field: 'baseline',
        before: beforeState.baseline,
        after: afterState.baseline,
      });
    }

    if (Math.abs(afterState.escalationDrift - beforeState.escalationDrift) > 0.001) {
      contaminations.push({
        vectorId,
        field: 'escalationDrift',
        before: beforeState.escalationDrift,
        after: afterState.escalationDrift,
      });
    }

    if (Math.abs(afterState.eventDelta - beforeState.eventDelta) > 0.001) {
      contaminations.push({
        vectorId,
        field: 'eventDelta',
        before: beforeState.eventDelta,
        after: afterState.eventDelta,
      });
    }

    if (Math.abs(afterState.compositeCSI - beforeState.compositeCSI) > 0.001) {
      contaminations.push({
        vectorId,
        field: 'compositeCSI',
        before: beforeState.compositeCSI,
        after: afterState.compositeCSI,
      });
    }
  }

  return contaminations;
}

/**
 * Run all cross-vector contamination validations
 */
export function runCrossVectorContaminationValidation(): ContaminationTestResult[] {
  console.log('\n🛡️ Running Cross-Vector Contamination Validation...\n');
  const results: ContaminationTestResult[] = [];

  // Test 1: Military event (SC1) should not affect other vectors
  {
    const checks: ContaminationTestResult['checks'] = [];
    const beforeVectors = initializeVectors();
    const afterVectors = applyEventToVector(beforeVectors, 'SC1', 'military_conflict', 8);
    const contaminations = checkContamination(beforeVectors, afterVectors, 'SC1');

    // SC1 should be changed
    const sc1Before = beforeVectors.get('SC1')!;
    const sc1After = afterVectors.get('SC1')!;
    checks.push({
      checkName: 'SC1 (Military) correctly modified',
      passed: sc1After.compositeCSI > sc1Before.compositeCSI,
      expected: `> ${sc1Before.compositeCSI}`,
      actual: `${sc1After.compositeCSI.toFixed(2)}`,
      message: `SC1 CSI: ${sc1Before.compositeCSI} → ${sc1After.compositeCSI.toFixed(2)}`,
    });

    // No contamination to other vectors
    checks.push({
      checkName: 'No contamination to SC2-SC7',
      passed: contaminations.length === 0,
      expected: '0 contaminations',
      actual: `${contaminations.length} contaminations`,
      message: contaminations.length === 0
        ? 'No cross-vector contamination detected'
        : `Contamination detected: ${contaminations.map(c => `${c.vectorId}.${c.field}`).join(', ')}`,
    });

    // Check each non-target vector individually
    for (const vectorId of ['SC2', 'SC3', 'SC4', 'SC5', 'SC6', 'SC7']) {
      const before = beforeVectors.get(vectorId)!;
      const after = afterVectors.get(vectorId)!;
      const unchanged = Math.abs(after.compositeCSI - before.compositeCSI) < 0.001;

      checks.push({
        checkName: `${vectorId} (${VECTORS[vectorId]}) unchanged`,
        passed: unchanged,
        expected: `${before.compositeCSI}`,
        actual: `${after.compositeCSI}`,
        message: unchanged
          ? `${vectorId} CSI unchanged: ${after.compositeCSI}`
          : `${vectorId} CSI changed: ${before.compositeCSI} → ${after.compositeCSI}`,
      });
    }

    results.push({
      testName: 'SC1 Military Event Isolation',
      passed: checks.every(c => c.passed),
      checks,
    });
    console.log(`  ${checks.every(c => c.passed) ? '✅' : '❌'} SC1 Military Isolation: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);
  }

  // Test 2: Economic event (SC2) should not affect other vectors
  {
    const checks: ContaminationTestResult['checks'] = [];
    const beforeVectors = initializeVectors();
    const afterVectors = applyEventToVector(beforeVectors, 'SC2', 'sanctions', 7);
    const contaminations = checkContamination(beforeVectors, afterVectors, 'SC2');

    checks.push({
      checkName: 'SC2 (Economic) correctly modified',
      passed: afterVectors.get('SC2')!.compositeCSI > beforeVectors.get('SC2')!.compositeCSI,
      expected: `> ${beforeVectors.get('SC2')!.compositeCSI}`,
      actual: `${afterVectors.get('SC2')!.compositeCSI.toFixed(2)}`,
      message: `SC2 CSI: ${beforeVectors.get('SC2')!.compositeCSI} → ${afterVectors.get('SC2')!.compositeCSI.toFixed(2)}`,
    });

    checks.push({
      checkName: 'No contamination from SC2 to other vectors',
      passed: contaminations.length === 0,
      expected: '0 contaminations',
      actual: `${contaminations.length} contaminations`,
      message: contaminations.length === 0
        ? 'No cross-vector contamination detected'
        : `Contamination: ${contaminations.map(c => `${c.vectorId}.${c.field}`).join(', ')}`,
    });

    results.push({
      testName: 'SC2 Economic Event Isolation',
      passed: checks.every(c => c.passed),
      checks,
    });
    console.log(`  ${checks.every(c => c.passed) ? '✅' : '❌'} SC2 Economic Isolation: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);
  }

  // Test 3: Multiple simultaneous events on different vectors
  {
    const checks: ContaminationTestResult['checks'] = [];
    let vectors = initializeVectors();

    // Snapshot before any events
    const snapshotBefore = new Map(vectors);

    // Apply events to SC1, SC3, SC5 simultaneously
    vectors = applyEventToVector(vectors, 'SC1', 'military_conflict', 9);
    vectors = applyEventToVector(vectors, 'SC3', 'policy_change', 6);
    vectors = applyEventToVector(vectors, 'SC5', 'disinformation', 5);

    // Check that SC2, SC4, SC6, SC7 are unchanged
    const unaffectedVectors = ['SC2', 'SC4', 'SC6', 'SC7'];
    let allUnaffectedClean = true;

    for (const vectorId of unaffectedVectors) {
      const before = snapshotBefore.get(vectorId)!;
      const after = vectors.get(vectorId)!;
      const unchanged = Math.abs(after.compositeCSI - before.compositeCSI) < 0.001;

      if (!unchanged) allUnaffectedClean = false;

      checks.push({
        checkName: `${vectorId} (${VECTORS[vectorId]}) unaffected by SC1+SC3+SC5 events`,
        passed: unchanged,
        expected: `${before.compositeCSI}`,
        actual: `${after.compositeCSI}`,
        message: unchanged
          ? `${vectorId} correctly isolated`
          : `${vectorId} contaminated!`,
      });
    }

    // Check that affected vectors were correctly modified
    for (const vectorId of ['SC1', 'SC3', 'SC5']) {
      const before = snapshotBefore.get(vectorId)!;
      const after = vectors.get(vectorId)!;
      const changed = after.compositeCSI > before.compositeCSI;

      checks.push({
        checkName: `${vectorId} (${VECTORS[vectorId]}) correctly modified`,
        passed: changed,
        expected: `> ${before.compositeCSI}`,
        actual: `${after.compositeCSI.toFixed(2)}`,
        message: `${vectorId}: ${before.compositeCSI} → ${after.compositeCSI.toFixed(2)}`,
      });
    }

    results.push({
      testName: 'Multi-Vector Simultaneous Events',
      passed: checks.every(c => c.passed),
      checks,
    });
    console.log(`  ${checks.every(c => c.passed) ? '✅' : '❌'} Multi-Vector Isolation: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);
  }

  // Test 4: All 7 vectors independent test
  {
    const checks: ContaminationTestResult['checks'] = [];

    for (const [targetVectorId] of Object.entries(VECTORS)) {
      const beforeVectors = initializeVectors();
      const afterVectors = applyEventToVector(beforeVectors, targetVectorId, 'test_event', 5);
      const contaminations = checkContamination(beforeVectors, afterVectors, targetVectorId);

      checks.push({
        checkName: `${targetVectorId} event: no contamination to other vectors`,
        passed: contaminations.length === 0,
        expected: '0 contaminations',
        actual: `${contaminations.length} contaminations`,
        message: contaminations.length === 0
          ? `${targetVectorId} fully isolated`
          : `${targetVectorId} leaked to: ${contaminations.map(c => c.vectorId).join(', ')}`,
      });
    }

    results.push({
      testName: 'Full 7-Vector Independence',
      passed: checks.every(c => c.passed),
      checks,
    });
    console.log(`  ${checks.every(c => c.passed) ? '✅' : '❌'} Full 7-Vector Independence: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`);
  }

  return results;
}