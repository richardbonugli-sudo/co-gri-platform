/**
 * Time Series Validator
 * 
 * Validates 60-day time series for China, Venezuela, and Russia.
 * Marks timestamps for: detection, escalation drift onset, event confirmation,
 * netting application, decay initiation.
 * 
 * CSI Formula: Structural Baseline + Escalation Drift + Event Delta
 */

export interface TimeSeriesPoint {
  day: number;
  date: string;
  structuralBaseline: number;
  escalationDrift: number;
  eventDelta: number;
  compositeCSI: number;
  markers: string[];
}

export interface TimeSeriesScenario {
  country: string;
  vector: string;
  eventType: string;
  severity: number;
  structuralBaseline: number;
  timeline: TimeSeriesPoint[];
}

export interface TimeSeriesValidationResult {
  scenarioName: string;
  country: string;
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

/**
 * Generate a 60-day time series for a given scenario
 */
function generateTimeSeries(
  country: string,
  vector: string,
  eventType: string,
  severity: number,
  structuralBaseline: number,
  detectionDay: number,
  escalationOnsetDay: number,
  confirmationDay: number,
  nettingDay: number,
  decayInitDay: number
): TimeSeriesScenario {
  const timeline: TimeSeriesPoint[] = [];
  const baseDate = new Date('2025-01-01');

  let escalationDrift = 0;
  let eventDelta = 0;
  const escalationRate = severity * 0.3;
  const eventImpact = severity * 1.5;

  for (let day = 0; day < 60; day++) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() + day);
    const markers: string[] = [];

    // Detection phase
    if (day === detectionDay) {
      markers.push('DETECTION');
    }

    // Escalation drift onset
    if (day === escalationOnsetDay) {
      markers.push('ESCALATION_DRIFT_ONSET');
    }

    // Build escalation drift between onset and confirmation
    if (day >= escalationOnsetDay && day < confirmationDay) {
      escalationDrift = Math.min(
        escalationRate * (day - escalationOnsetDay + 1),
        severity * 2
      );
    }

    // Event confirmation
    if (day === confirmationDay) {
      markers.push('EVENT_CONFIRMATION');
      eventDelta = eventImpact;
    }

    // Netting application - confirmation absorbs prior escalation drift
    if (day === nettingDay) {
      markers.push('NETTING_APPLICATION');
      // Netting: event delta absorbs escalation drift within same vector
      const nettedEscalation = Math.max(0, escalationDrift - eventDelta * 0.5);
      escalationDrift = nettedEscalation;
    }

    // Decay initiation
    if (day === decayInitDay) {
      markers.push('DECAY_INITIATION');
    }

    // Apply exponential decay after decay initiation
    if (day > decayInitDay) {
      const daysSinceDecay = day - decayInitDay;
      const decayFactor = Math.exp(-DECAY_LAMBDA * daysSinceDecay);
      eventDelta = eventImpact * decayFactor;
      if (escalationDrift > 0) {
        escalationDrift = escalationDrift * decayFactor;
      }
    }

    const compositeCSI = structuralBaseline + escalationDrift + eventDelta;

    timeline.push({
      day,
      date: currentDate.toISOString().split('T')[0],
      structuralBaseline,
      escalationDrift: parseFloat(escalationDrift.toFixed(4)),
      eventDelta: parseFloat(eventDelta.toFixed(4)),
      compositeCSI: parseFloat(compositeCSI.toFixed(4)),
      markers,
    });
  }

  return {
    country,
    vector,
    eventType,
    severity,
    structuralBaseline,
    timeline,
  };
}

/**
 * Validate a time series scenario
 */
function validateScenario(scenario: TimeSeriesScenario): TimeSeriesValidationResult {
  const checks: TimeSeriesValidationResult['checks'] = [];

  // Check 1: Detection marker exists
  const detectionPoint = scenario.timeline.find(p => p.markers.includes('DETECTION'));
  checks.push({
    checkName: 'Detection Marker Present',
    passed: !!detectionPoint,
    expected: 'DETECTION marker in timeline',
    actual: detectionPoint ? `Found at day ${detectionPoint.day}` : 'Not found',
    message: detectionPoint ? `Detection at day ${detectionPoint.day}` : 'Missing detection marker',
  });

  // Check 2: Escalation drift onset marker exists
  const escalationPoint = scenario.timeline.find(p => p.markers.includes('ESCALATION_DRIFT_ONSET'));
  checks.push({
    checkName: 'Escalation Drift Onset Present',
    passed: !!escalationPoint,
    expected: 'ESCALATION_DRIFT_ONSET marker in timeline',
    actual: escalationPoint ? `Found at day ${escalationPoint.day}` : 'Not found',
    message: escalationPoint ? `Escalation onset at day ${escalationPoint.day}` : 'Missing escalation onset',
  });

  // Check 3: Event confirmation marker exists
  const confirmationPoint = scenario.timeline.find(p => p.markers.includes('EVENT_CONFIRMATION'));
  checks.push({
    checkName: 'Event Confirmation Present',
    passed: !!confirmationPoint,
    expected: 'EVENT_CONFIRMATION marker in timeline',
    actual: confirmationPoint ? `Found at day ${confirmationPoint.day}` : 'Not found',
    message: confirmationPoint ? `Confirmation at day ${confirmationPoint.day}` : 'Missing confirmation',
  });

  // Check 4: Netting application marker exists
  const nettingPoint = scenario.timeline.find(p => p.markers.includes('NETTING_APPLICATION'));
  checks.push({
    checkName: 'Netting Application Present',
    passed: !!nettingPoint,
    expected: 'NETTING_APPLICATION marker in timeline',
    actual: nettingPoint ? `Found at day ${nettingPoint.day}` : 'Not found',
    message: nettingPoint ? `Netting at day ${nettingPoint.day}` : 'Missing netting',
  });

  // Check 5: Decay initiation marker exists
  const decayPoint = scenario.timeline.find(p => p.markers.includes('DECAY_INITIATION'));
  checks.push({
    checkName: 'Decay Initiation Present',
    passed: !!decayPoint,
    expected: 'DECAY_INITIATION marker in timeline',
    actual: decayPoint ? `Found at day ${decayPoint.day}` : 'Not found',
    message: decayPoint ? `Decay initiation at day ${decayPoint.day}` : 'Missing decay initiation',
  });

  // Check 6: CSI formula correctness (Baseline + Drift + Delta = Composite)
  let formulaCorrect = true;
  for (const point of scenario.timeline) {
    const expected = point.structuralBaseline + point.escalationDrift + point.eventDelta;
    if (Math.abs(expected - point.compositeCSI) > 0.01) {
      formulaCorrect = false;
      break;
    }
  }
  checks.push({
    checkName: 'CSI Formula Correctness',
    passed: formulaCorrect,
    expected: 'Baseline + Drift + Delta = Composite for all points',
    actual: formulaCorrect ? 'All points match' : 'Formula mismatch detected',
    message: formulaCorrect ? 'CSI formula validated' : 'CSI formula error in timeline',
  });

  // Check 7: Escalation drift increases before confirmation
  let driftIncreasing = true;
  if (escalationPoint && confirmationPoint) {
    for (let i = escalationPoint.day + 1; i < confirmationPoint.day; i++) {
      if (scenario.timeline[i].escalationDrift < scenario.timeline[i - 1].escalationDrift) {
        driftIncreasing = false;
        break;
      }
    }
  }
  checks.push({
    checkName: 'Escalation Drift Increases Before Confirmation',
    passed: driftIncreasing,
    expected: 'Drift monotonically increasing before confirmation',
    actual: driftIncreasing ? 'Drift increasing correctly' : 'Drift decreased unexpectedly',
    message: driftIncreasing ? 'Escalation drift behavior correct' : 'Escalation drift behavior incorrect',
  });

  // Check 8: Decay reduces event delta after decay initiation
  let decayWorking = true;
  if (decayPoint) {
    const decayStart = decayPoint.day;
    for (let i = decayStart + 2; i < scenario.timeline.length; i++) {
      if (scenario.timeline[i].eventDelta > scenario.timeline[i - 1].eventDelta + 0.001) {
        decayWorking = false;
        break;
      }
    }
  }
  checks.push({
    checkName: 'Decay Reduces Event Delta',
    passed: decayWorking,
    expected: 'Event delta decreases after decay initiation',
    actual: decayWorking ? 'Decay working correctly' : 'Decay not reducing event delta',
    message: decayWorking ? 'Exponential decay validated' : 'Decay behavior incorrect',
  });

  // Check 9: Composite CSI at day 59 is less than peak
  const peakCSI = Math.max(...scenario.timeline.map(p => p.compositeCSI));
  const finalCSI = scenario.timeline[59].compositeCSI;
  const decayedFromPeak = finalCSI < peakCSI;
  checks.push({
    checkName: 'CSI Decays From Peak',
    passed: decayedFromPeak,
    expected: 'Final CSI < Peak CSI',
    actual: `Peak: ${peakCSI.toFixed(2)}, Final: ${finalCSI.toFixed(2)}`,
    message: decayedFromPeak ? 'CSI decayed from peak correctly' : 'CSI did not decay from peak',
  });

  const allPassed = checks.every(c => c.passed);

  return {
    scenarioName: `${scenario.country} - ${scenario.eventType} (${scenario.vector})`,
    country: scenario.country,
    passed: allPassed,
    checks,
  };
}

/**
 * Run all time series validation scenarios
 */
export function runTimeSeriesValidation(): TimeSeriesValidationResult[] {
  console.log('\n📊 Running Time Series Validation...\n');
  const results: TimeSeriesValidationResult[] = [];

  // Scenario 1: China - Trade War (SC2: Economic)
  const chinaScenario = generateTimeSeries(
    'China', 'SC2', 'trade_war', 7, 45.0,
    3,   // detection day
    5,   // escalation onset day
    15,  // confirmation day
    16,  // netting day
    20   // decay initiation day
  );
  const chinaResult = validateScenario(chinaScenario);
  results.push(chinaResult);
  console.log(`  ${chinaResult.passed ? '✅' : '❌'} ${chinaResult.scenarioName}: ${chinaResult.checks.filter(c => c.passed).length}/${chinaResult.checks.length} checks passed`);

  // Scenario 2: Venezuela - Sanctions (SC2: Economic)
  const venezuelaScenario = generateTimeSeries(
    'Venezuela', 'SC2', 'sanctions', 8, 62.0,
    2,   // detection day
    4,   // escalation onset day
    12,  // confirmation day
    13,  // netting day
    18   // decay initiation day
  );
  const venezuelaResult = validateScenario(venezuelaScenario);
  results.push(venezuelaResult);
  console.log(`  ${venezuelaResult.passed ? '✅' : '❌'} ${venezuelaResult.scenarioName}: ${venezuelaResult.checks.filter(c => c.passed).length}/${venezuelaResult.checks.length} checks passed`);

  // Scenario 3: Russia - Military Conflict (SC1: Military)
  const russiaScenario = generateTimeSeries(
    'Russia', 'SC1', 'military_conflict', 9, 55.0,
    1,   // detection day
    3,   // escalation onset day
    10,  // confirmation day
    11,  // netting day
    15   // decay initiation day
  );
  const russiaResult = validateScenario(russiaScenario);
  results.push(russiaResult);
  console.log(`  ${russiaResult.passed ? '✅' : '❌'} ${russiaResult.scenarioName}: ${russiaResult.checks.filter(c => c.passed).length}/${russiaResult.checks.length} checks passed`);

  return results;
}