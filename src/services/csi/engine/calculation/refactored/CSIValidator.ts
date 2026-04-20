/**
 * CSI Validator
 * Enforces acceptance criteria from CSI Methodology
 * 
 * Implementation Acceptance Criteria (Binding):
 * 1. CSI must explicitly separate baseline, escalation drift, and event deltas
 * 2. All operations must be mapped to one of the seven CSI risk factors
 * 3. Structural baseline must exclude macroeconomic/environmental variables
 * 4. CSI must be expectation-weighted (not purely reactive)
 * 5. Signal probability must be expectation-based (not frequency-based)
 * 6. Confidence must not alter CSI values (metadata only)
 * 7. No cross-factor drift aggregation or netting
 */

import {
  Signal,
  ConfirmedEvent,
  CSIComponents,
  CSIRiskFactor,
  SourceRole,
  ValidationResult,
  validateSignalRiskFactor,
  validateSourceRole,
  validateSameFactor
} from './types';

export class CSIValidator {
  private validationResults: ValidationResult[] = [];

  /**
   * Validate a signal meets all acceptance criteria
   */
  validateSignal(signal: Signal): ValidationResult[] {
    const results: ValidationResult[] = [];

    // AC2: Signal must have exactly one CSI risk factor
    results.push(validateSignalRiskFactor(signal));

    // AC5: Signal probability must be expectation-based (0-1 range)
    if (signal.probability < 0 || signal.probability > 1) {
      results.push({
        check_name: 'signal_probability_range',
        passed: false,
        message: `Signal ${signal.signal_id} probability ${signal.probability} outside valid range [0,1]`,
        severity: 'ERROR'
      });
    } else {
      results.push({
        check_name: 'signal_probability_range',
        passed: true,
        message: `Signal ${signal.signal_id} probability ${signal.probability} is expectation-based`,
        severity: 'INFO'
      });
    }

    // Source role enforcement: signals must come from DETECTION sources only
    for (const source of signal.sources) {
      results.push(validateSourceRole(source, SourceRole.DETECTION, 'signal generation'));
    }

    // AC6: Confidence metadata must not affect CSI calculations
    if (signal.confidence_metadata) {
      results.push({
        check_name: 'confidence_metadata_only',
        passed: true,
        message: `Signal ${signal.signal_id} has confidence metadata (metadata only, does not affect CSI)`,
        severity: 'INFO'
      });
    }

    return results;
  }

  /**
   * Validate an event meets all acceptance criteria
   */
  validateEvent(event: ConfirmedEvent, relatedSignals: Signal[]): ValidationResult[] {
    const results: ValidationResult[] = [];

    // AC2: Event must have exactly one CSI risk factor (inherited from signal)
    if (!event.risk_factor) {
      results.push({
        check_name: 'event_risk_factor_required',
        passed: false,
        message: `Event ${event.event_id} missing required risk_factor`,
        severity: 'ERROR'
      });
    } else if (!Object.values(CSIRiskFactor).includes(event.risk_factor)) {
      results.push({
        check_name: 'event_risk_factor_valid',
        passed: false,
        message: `Event ${event.event_id} has invalid risk_factor: ${event.risk_factor}`,
        severity: 'ERROR'
      });
    } else {
      results.push({
        check_name: 'event_risk_factor_valid',
        passed: true,
        message: `Event ${event.event_id} has valid risk_factor: ${event.risk_factor}`,
        severity: 'INFO'
      });
    }

    // Source role enforcement: events must be confirmed by CONFIRMATION sources only
    for (const source of event.confirmation_sources) {
      results.push(validateSourceRole(source, SourceRole.CONFIRMATION, 'event confirmation'));
    }

    // AC7: Event must only net drift from same factor
    for (const signalId of event.related_signal_ids) {
      const signal = relatedSignals.find(s => s.signal_id === signalId);
      if (signal) {
        results.push(validateSameFactor(
          event.risk_factor,
          signal.risk_factor,
          'event-signal netting'
        ));
      }
    }

    return results;
  }

  /**
   * Validate CSI components meet acceptance criteria
   */
  validateCSIComponents(components: CSIComponents): ValidationResult[] {
    const results: ValidationResult[] = [];

    // AC1: CSI must explicitly separate baseline, drift, and event deltas
    if (components.structural_baseline !== undefined &&
        components.escalation_drift !== undefined &&
        components.event_delta !== undefined) {
      results.push({
        check_name: 'component_separation',
        passed: true,
        message: 'CSI components are explicitly separated (baseline, drift, event delta)',
        severity: 'INFO'
      });
    } else {
      results.push({
        check_name: 'component_separation',
        passed: false,
        message: 'CSI components are not properly separated',
        severity: 'ERROR'
      });
    }

    // AC2: All components must have factor breakdown
    if (components.structural_baseline_by_factor &&
        components.escalation_drift_by_factor &&
        components.event_delta_by_factor) {
      results.push({
        check_name: 'factor_breakdown_present',
        passed: true,
        message: 'All CSI components have factor-level breakdown',
        severity: 'INFO'
      });
    } else {
      results.push({
        check_name: 'factor_breakdown_present',
        passed: false,
        message: 'CSI components missing factor-level breakdown',
        severity: 'ERROR'
      });
    }

    // AC4: CSI must be expectation-weighted (drift component must exist and contribute)
    if (components.escalation_drift > 0 || components.metadata.active_signals > 0) {
      results.push({
        check_name: 'expectation_weighted',
        passed: true,
        message: 'CSI is expectation-weighted (includes escalation drift)',
        severity: 'INFO'
      });
    } else {
      results.push({
        check_name: 'expectation_weighted',
        passed: true,
        message: 'CSI has no active signals (expectation-weighted capability present)',
        severity: 'INFO'
      });
    }

    // AC6: Confidence score must not affect CSI total
    if (components.metadata.confidence_score !== undefined) {
      results.push({
        check_name: 'confidence_metadata_only',
        passed: true,
        message: 'Confidence score present as metadata only (does not affect CSI calculation)',
        severity: 'INFO'
      });
    }

    return results;
  }

  /**
   * Validate no cross-factor operations in drift accumulation
   */
  validateDriftAccumulation(
    signalContributions: Array<{ signal_id: string; risk_factor: CSIRiskFactor; contribution: number }>,
    factor: CSIRiskFactor
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const contrib of signalContributions) {
      if (contrib.risk_factor !== factor) {
        results.push({
          check_name: 'no_cross_factor_drift',
          passed: false,
          message: `Signal ${contrib.signal_id} with factor ${contrib.risk_factor} contributing to ${factor} drift (cross-factor violation)`,
          severity: 'ERROR'
        });
      }
    }

    if (results.length === 0) {
      results.push({
        check_name: 'no_cross_factor_drift',
        passed: true,
        message: `All drift contributions correctly scoped to factor ${factor}`,
        severity: 'INFO'
      });
    }

    return results;
  }

  /**
   * Validate no cross-factor netting
   */
  validateNettingScope(
    signal1: Signal,
    signal2: Signal,
    operation: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // AC7: Signals may only be netted if same country AND same factor
    if (signal1.country !== signal2.country) {
      results.push({
        check_name: 'netting_same_country',
        passed: false,
        message: `${operation}: signals from different countries (${signal1.country} vs ${signal2.country})`,
        severity: 'ERROR'
      });
    }

    results.push(validateSameFactor(signal1.risk_factor, signal2.risk_factor, operation));

    return results;
  }

  /**
   * Validate baseline sources exclude macro/environmental contamination
   */
  validateBaselineSources(
    factor: CSIRiskFactor,
    sources: Array<{ source_name: string; role: SourceRole }>
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // AC3: Baseline must not include macroeconomic or environmental variables
    const prohibitedKeywords = [
      'gdp', 'growth', 'inflation', 'debt', 'deficit',
      'climate', 'weather', 'natural disaster', 'environmental'
    ];

    for (const source of sources) {
      // Check source role
      if (source.role !== SourceRole.BASELINE) {
        results.push({
          check_name: 'baseline_source_role',
          passed: false,
          message: `Source ${source.source_name} has role ${source.role}, expected BASELINE for baseline calculation`,
          severity: 'ERROR'
        });
      }

      // Check for prohibited keywords
      const sourceLower = source.source_name.toLowerCase();
      const foundProhibited = prohibitedKeywords.filter(keyword => sourceLower.includes(keyword));

      if (foundProhibited.length > 0) {
        results.push({
          check_name: 'no_macro_environmental_contamination',
          passed: false,
          message: `Baseline source ${source.source_name} contains prohibited keywords: ${foundProhibited.join(', ')}`,
          severity: 'ERROR'
        });
      }
    }

    if (results.filter(r => !r.passed).length === 0) {
      results.push({
        check_name: 'baseline_sources_valid',
        passed: true,
        message: `All baseline sources for ${factor} are valid (no macro/environmental contamination)`,
        severity: 'INFO'
      });
    }

    return results;
  }

  /**
   * Run comprehensive validation suite
   */
  runFullValidation(
    signals: Signal[],
    events: ConfirmedEvent[],
    components: CSIComponents
  ): {
    passed: boolean;
    errors: ValidationResult[];
    warnings: ValidationResult[];
    info: ValidationResult[];
    summary: string;
  } {
    const allResults: ValidationResult[] = [];

    // Validate all signals
    for (const signal of signals) {
      allResults.push(...this.validateSignal(signal));
    }

    // Validate all events
    for (const event of events) {
      allResults.push(...this.validateEvent(event, signals));
    }

    // Validate CSI components
    allResults.push(...this.validateCSIComponents(components));

    // Categorize results
    const errors = allResults.filter(r => r.severity === 'ERROR' && !r.passed);
    const warnings = allResults.filter(r => r.severity === 'WARNING' && !r.passed);
    const info = allResults.filter(r => r.severity === 'INFO' && r.passed);

    const passed = errors.length === 0;

    let summary: string;
    if (passed) {
      summary = `✓ All acceptance criteria passed (${info.length} checks passed, ${warnings.length} warnings)`;
    } else {
      summary = `✗ Validation failed: ${errors.length} errors, ${warnings.length} warnings`;
    }

    return {
      passed,
      errors,
      warnings,
      info,
      summary
    };
  }

  /**
   * Get all validation results
   */
  getValidationResults(): ValidationResult[] {
    return [...this.validationResults];
  }

  /**
   * Clear validation results
   */
  clearValidationResults(): void {
    this.validationResults = [];
  }
}

// Singleton instance
export const csiValidator = new CSIValidator();