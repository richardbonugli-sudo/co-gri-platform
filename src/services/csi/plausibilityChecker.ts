/**
 * Plausibility Checker
 * 
 * Validates CSI changes are within reasonable bounds, checks for
 * logical consistency, detects anomalies, and flags events for review.
 */

import type { EventCategory, EventSeverity } from '@/data/geopoliticalEvents';
import type { ClassificationResult } from './eventClassificationEngine';
import type { PropagationChain } from './regionalPropagationEngine';

export interface PlausibilityCheck {
  eventId: string;
  timestamp: Date;
  checks: CheckResult[];
  overallStatus: 'pass' | 'warning' | 'fail';
  confidence: number;
  requiresReview: boolean;
  explanation: string;
}

export interface CheckResult {
  checkName: string;
  checkType: 'bounds' | 'consistency' | 'anomaly' | 'logic';
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: Record<string, unknown>;
}

export interface AnomalyReport {
  eventId: string;
  anomalyType: 'magnitude' | 'direction' | 'propagation' | 'classification';
  severity: 'high' | 'medium' | 'low';
  description: string;
  expectedRange: { min: number; max: number };
  actualValue: number;
  suggestedAction: string;
}

// Plausibility bounds by severity
const DELTA_CSI_BOUNDS: Record<EventSeverity, { min: number; max: number }> = {
  'Critical': { min: 8, max: 25 },
  'High': { min: 4, max: 15 },
  'Moderate': { min: 1, max: 8 },
  'Low': { min: 0, max: 4 }
};

// Expected direction by category
const EXPECTED_DIRECTION: Record<EventCategory, 'increase' | 'decrease' | 'any'> = {
  'Conflict': 'increase',
  'Sanctions': 'increase',
  'Trade': 'increase',
  'Governance': 'any',
  'Cyber': 'increase',
  'Unrest': 'increase',
  'Currency': 'increase'
};

// Maximum propagation effects
const MAX_PROPAGATION_EFFECTS = 20;
const MAX_PROPAGATION_DECAY = 0.6;

class PlausibilityChecker {
  private checkHistory: Map<string, PlausibilityCheck> = new Map();
  private anomalies: AnomalyReport[] = [];

  /**
   * Run all plausibility checks on an event
   */
  checkEvent(
    eventId: string,
    category: EventCategory,
    severity: EventSeverity,
    deltaCSI: number,
    classification: ClassificationResult,
    propagation?: PropagationChain
  ): PlausibilityCheck {
    const checks: CheckResult[] = [];
    
    // 1. Bounds check
    checks.push(this.checkBounds(deltaCSI, severity));
    
    // 2. Direction consistency check
    checks.push(this.checkDirectionConsistency(deltaCSI, category));
    
    // 3. Classification confidence check
    checks.push(this.checkClassificationConfidence(classification));
    
    // 4. Vector contribution check
    checks.push(this.checkVectorContributions(classification));
    
    // 5. Propagation check (if available)
    if (propagation) {
      checks.push(this.checkPropagation(propagation));
    }
    
    // 6. Severity-magnitude alignment
    checks.push(this.checkSeverityAlignment(deltaCSI, severity));
    
    // Calculate overall status
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;
    
    let overallStatus: 'pass' | 'warning' | 'fail';
    if (failCount > 0) {
      overallStatus = 'fail';
    } else if (warningCount > 1) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'pass';
    }
    
    // Calculate confidence
    const passCount = checks.filter(c => c.status === 'pass').length;
    const confidence = (passCount / checks.length) * 100;
    
    // Generate explanation
    const explanation = this.generateExplanation(checks, overallStatus);
    
    const result: PlausibilityCheck = {
      eventId,
      timestamp: new Date(),
      checks,
      overallStatus,
      confidence,
      requiresReview: overallStatus === 'fail' || warningCount >= 2,
      explanation
    };
    
    // Store result
    this.checkHistory.set(eventId, result);
    
    // Record anomalies
    if (result.requiresReview) {
      this.recordAnomalies(eventId, checks, deltaCSI, severity);
    }
    
    console.log(`[Plausibility] ${overallStatus === 'pass' ? '✅' : overallStatus === 'warning' ? '⚠️' : '❌'} Event ${eventId}: ${overallStatus} (${confidence.toFixed(0)}% confidence)`);
    
    return result;
  }

  /**
   * Check if delta CSI is within expected bounds
   */
  private checkBounds(deltaCSI: number, severity: EventSeverity): CheckResult {
    const bounds = DELTA_CSI_BOUNDS[severity];
    const absDelta = Math.abs(deltaCSI);
    
    if (absDelta >= bounds.min && absDelta <= bounds.max) {
      return {
        checkName: 'Bounds Check',
        checkType: 'bounds',
        status: 'pass',
        message: `ΔCSI (${deltaCSI.toFixed(1)}) is within expected range for ${severity} severity`,
        details: { deltaCSI, bounds }
      };
    } else if (absDelta < bounds.min) {
      return {
        checkName: 'Bounds Check',
        checkType: 'bounds',
        status: 'warning',
        message: `ΔCSI (${deltaCSI.toFixed(1)}) is below expected minimum (${bounds.min}) for ${severity} severity`,
        details: { deltaCSI, bounds }
      };
    } else {
      return {
        checkName: 'Bounds Check',
        checkType: 'bounds',
        status: absDelta > bounds.max * 1.5 ? 'fail' : 'warning',
        message: `ΔCSI (${deltaCSI.toFixed(1)}) exceeds expected maximum (${bounds.max}) for ${severity} severity`,
        details: { deltaCSI, bounds }
      };
    }
  }

  /**
   * Check if direction is consistent with event category
   */
  private checkDirectionConsistency(deltaCSI: number, category: EventCategory): CheckResult {
    const expectedDirection = EXPECTED_DIRECTION[category];
    const actualDirection = deltaCSI > 0 ? 'increase' : deltaCSI < 0 ? 'decrease' : 'neutral';
    
    if (expectedDirection === 'any' || expectedDirection === actualDirection) {
      return {
        checkName: 'Direction Consistency',
        checkType: 'consistency',
        status: 'pass',
        message: `Direction (${actualDirection}) is consistent with ${category} events`,
        details: { expectedDirection, actualDirection, deltaCSI }
      };
    } else if (deltaCSI === 0) {
      return {
        checkName: 'Direction Consistency',
        checkType: 'consistency',
        status: 'warning',
        message: `Zero impact is unusual for ${category} events`,
        details: { expectedDirection, actualDirection, deltaCSI }
      };
    } else {
      return {
        checkName: 'Direction Consistency',
        checkType: 'consistency',
        status: 'fail',
        message: `Direction (${actualDirection}) is inconsistent with ${category} events (expected ${expectedDirection})`,
        details: { expectedDirection, actualDirection, deltaCSI }
      };
    }
  }

  /**
   * Check classification confidence
   */
  private checkClassificationConfidence(classification: ClassificationResult): CheckResult {
    const confidence = classification.confidence;
    
    if (confidence >= 0.7) {
      return {
        checkName: 'Classification Confidence',
        checkType: 'anomaly',
        status: 'pass',
        message: `Classification confidence (${(confidence * 100).toFixed(0)}%) is acceptable`,
        details: { confidence }
      };
    } else if (confidence >= 0.5) {
      return {
        checkName: 'Classification Confidence',
        checkType: 'anomaly',
        status: 'warning',
        message: `Classification confidence (${(confidence * 100).toFixed(0)}%) is below optimal threshold`,
        details: { confidence }
      };
    } else {
      return {
        checkName: 'Classification Confidence',
        checkType: 'anomaly',
        status: 'fail',
        message: `Classification confidence (${(confidence * 100).toFixed(0)}%) is too low for reliable prediction`,
        details: { confidence }
      };
    }
  }

  /**
   * Check vector contributions are reasonable
   */
  private checkVectorContributions(classification: ClassificationResult): CheckResult {
    const primaryWeight = classification.primaryVector.weight;
    const primaryConfidence = classification.primaryVector.confidence;
    
    // Check if primary vector dominates appropriately
    const secondarySum = classification.secondaryVectors.reduce((sum, v) => sum + v.confidence, 0);
    
    if (primaryConfidence > secondarySum * 0.5) {
      return {
        checkName: 'Vector Contributions',
        checkType: 'logic',
        status: 'pass',
        message: `Primary vector (${classification.primaryVector.vector}) appropriately dominates classification`,
        details: { primaryConfidence, secondarySum }
      };
    } else if (primaryConfidence > secondarySum * 0.3) {
      return {
        checkName: 'Vector Contributions',
        checkType: 'logic',
        status: 'warning',
        message: `Primary vector contribution is relatively weak compared to secondary vectors`,
        details: { primaryConfidence, secondarySum }
      };
    } else {
      return {
        checkName: 'Vector Contributions',
        checkType: 'logic',
        status: 'warning',
        message: `Classification may be ambiguous - multiple vectors have similar weights`,
        details: { primaryConfidence, secondarySum }
      };
    }
  }

  /**
   * Check propagation effects are reasonable
   */
  private checkPropagation(propagation: PropagationChain): CheckResult {
    const effectCount = propagation.effects.length;
    const maxDecay = Math.max(...propagation.effects.map(e => e.decayFactor), 0);
    
    const issues: string[] = [];
    
    if (effectCount > MAX_PROPAGATION_EFFECTS) {
      issues.push(`Too many propagation effects (${effectCount} > ${MAX_PROPAGATION_EFFECTS})`);
    }
    
    if (maxDecay > MAX_PROPAGATION_DECAY) {
      issues.push(`Propagation decay factor too high (${maxDecay.toFixed(2)} > ${MAX_PROPAGATION_DECAY})`);
    }
    
    // Check for circular propagation
    const countries = propagation.effects.map(e => e.targetCountry);
    const uniqueCountries = new Set(countries);
    if (countries.length !== uniqueCountries.size) {
      issues.push('Duplicate countries in propagation chain');
    }
    
    if (issues.length === 0) {
      return {
        checkName: 'Propagation Check',
        checkType: 'logic',
        status: 'pass',
        message: `Propagation effects (${effectCount} countries) are within expected bounds`,
        details: { effectCount, maxDecay }
      };
    } else if (issues.length === 1) {
      return {
        checkName: 'Propagation Check',
        checkType: 'logic',
        status: 'warning',
        message: issues[0],
        details: { effectCount, maxDecay, issues }
      };
    } else {
      return {
        checkName: 'Propagation Check',
        checkType: 'logic',
        status: 'fail',
        message: `Multiple propagation issues: ${issues.join('; ')}`,
        details: { effectCount, maxDecay, issues }
      };
    }
  }

  /**
   * Check severity-magnitude alignment
   */
  private checkSeverityAlignment(deltaCSI: number, severity: EventSeverity): CheckResult {
    const absDelta = Math.abs(deltaCSI);
    
    // Expected magnitude ranges
    const expectedRanges: Record<EventSeverity, { typical: number; tolerance: number }> = {
      'Critical': { typical: 15, tolerance: 8 },
      'High': { typical: 8, tolerance: 5 },
      'Moderate': { typical: 4, tolerance: 3 },
      'Low': { typical: 2, tolerance: 2 }
    };
    
    const expected = expectedRanges[severity];
    const deviation = Math.abs(absDelta - expected.typical);
    
    if (deviation <= expected.tolerance) {
      return {
        checkName: 'Severity Alignment',
        checkType: 'consistency',
        status: 'pass',
        message: `ΔCSI magnitude aligns with ${severity} severity classification`,
        details: { absDelta, expected, deviation }
      };
    } else if (deviation <= expected.tolerance * 1.5) {
      return {
        checkName: 'Severity Alignment',
        checkType: 'consistency',
        status: 'warning',
        message: `ΔCSI magnitude (${absDelta.toFixed(1)}) slightly misaligned with ${severity} severity`,
        details: { absDelta, expected, deviation }
      };
    } else {
      return {
        checkName: 'Severity Alignment',
        checkType: 'consistency',
        status: 'fail',
        message: `ΔCSI magnitude (${absDelta.toFixed(1)}) significantly misaligned with ${severity} severity (expected ~${expected.typical})`,
        details: { absDelta, expected, deviation }
      };
    }
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(checks: CheckResult[], status: 'pass' | 'warning' | 'fail'): string {
    const failedChecks = checks.filter(c => c.status === 'fail');
    const warningChecks = checks.filter(c => c.status === 'warning');
    const passedChecks = checks.filter(c => c.status === 'pass');
    
    if (status === 'pass') {
      return `All ${passedChecks.length} plausibility checks passed. CSI calculation appears valid.`;
    } else if (status === 'warning') {
      const warnings = warningChecks.map(c => c.checkName).join(', ');
      return `${passedChecks.length} checks passed, ${warningChecks.length} warnings (${warnings}). Review recommended but not critical.`;
    } else {
      const failures = failedChecks.map(c => c.checkName).join(', ');
      return `${failedChecks.length} checks failed (${failures}). Manual review required before using this prediction.`;
    }
  }

  /**
   * Record anomalies for flagged events
   */
  private recordAnomalies(
    eventId: string,
    checks: CheckResult[],
    deltaCSI: number,
    severity: EventSeverity
  ): void {
    const failedChecks = checks.filter(c => c.status === 'fail');
    
    failedChecks.forEach(check => {
      const anomaly: AnomalyReport = {
        eventId,
        anomalyType: this.mapCheckTypeToAnomalyType(check.checkType),
        severity: 'high',
        description: check.message,
        expectedRange: DELTA_CSI_BOUNDS[severity],
        actualValue: deltaCSI,
        suggestedAction: this.suggestAction(check)
      };
      
      this.anomalies.push(anomaly);
    });
  }

  /**
   * Map check type to anomaly type
   */
  private mapCheckTypeToAnomalyType(checkType: CheckResult['checkType']): AnomalyReport['anomalyType'] {
    switch (checkType) {
      case 'bounds': return 'magnitude';
      case 'consistency': return 'direction';
      case 'logic': return 'propagation';
      case 'anomaly': return 'classification';
      default: return 'classification';
    }
  }

  /**
   * Suggest action for failed check
   */
  private suggestAction(check: CheckResult): string {
    switch (check.checkType) {
      case 'bounds':
        return 'Review severity classification and adjust if necessary';
      case 'consistency':
        return 'Verify event category assignment and direction logic';
      case 'logic':
        return 'Check propagation rules and regional relationships';
      case 'anomaly':
        return 'Review classification keywords and source reliability';
      default:
        return 'Manual review recommended';
    }
  }

  /**
   * Get check result for an event
   */
  getCheckResult(eventId: string): PlausibilityCheck | undefined {
    return this.checkHistory.get(eventId);
  }

  /**
   * Get all events requiring review
   */
  getEventsRequiringReview(): PlausibilityCheck[] {
    return Array.from(this.checkHistory.values())
      .filter(check => check.requiresReview);
  }

  /**
   * Get all anomalies
   */
  getAnomalies(): AnomalyReport[] {
    return [...this.anomalies];
  }

  /**
   * Get anomalies by severity
   */
  getAnomaliesBySeverity(severity: AnomalyReport['severity']): AnomalyReport[] {
    return this.anomalies.filter(a => a.severity === severity);
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalChecks: number;
    passRate: number;
    warningRate: number;
    failRate: number;
    reviewRequired: number;
    anomalyCount: number;
  } {
    const checks = Array.from(this.checkHistory.values());
    const total = checks.length;
    
    if (total === 0) {
      return {
        totalChecks: 0,
        passRate: 0,
        warningRate: 0,
        failRate: 0,
        reviewRequired: 0,
        anomalyCount: 0
      };
    }
    
    const passCount = checks.filter(c => c.overallStatus === 'pass').length;
    const warningCount = checks.filter(c => c.overallStatus === 'warning').length;
    const failCount = checks.filter(c => c.overallStatus === 'fail').length;
    const reviewCount = checks.filter(c => c.requiresReview).length;
    
    return {
      totalChecks: total,
      passRate: (passCount / total) * 100,
      warningRate: (warningCount / total) * 100,
      failRate: (failCount / total) * 100,
      reviewRequired: reviewCount,
      anomalyCount: this.anomalies.length
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.checkHistory.clear();
    this.anomalies = [];
    console.log('[Plausibility] 🧹 Data cleared');
  }
}

// Singleton instance
export const plausibilityChecker = new PlausibilityChecker();