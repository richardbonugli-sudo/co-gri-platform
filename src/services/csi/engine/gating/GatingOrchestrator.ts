/**
 * Gating Orchestrator
 * Coordinates validation of event candidates through gating rules
 */

import { EventCandidate, GatingRule, GatingResult, SourceTier, EscalationLevel } from '../types';
import { escalationSignalLog } from '../state/EscalationSignalLog';
import { sourceRegistry } from '../sources/SourceRegistry';

export class GatingOrchestrator {
  private rules: Map<string, GatingRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default gating rules
   */
  private initializeDefaultRules(): void {
    // Rule 1: Tier Validation
    this.registerRule({
      ruleId: 'tier_validation',
      name: 'Source Tier Validation',
      description: 'At least one Tier 1 or Tier 2 source required',
      requiredTier: SourceTier.TIER_2_REPUTABLE,
      minimumSignals: 1,
      temporalWindow: 72,
      crossSourceRequired: false,
      vectorSpecific: false,
      enabled: true
    });

    // Rule 2: Cross-Source Confirmation
    this.registerRule({
      ruleId: 'cross_source_confirmation',
      name: 'Cross-Source Confirmation',
      description: 'Minimum 2 independent sources required',
      requiredTier: SourceTier.TIER_3_SUPPLEMENTARY,
      minimumSignals: 2,
      temporalWindow: 48,
      crossSourceRequired: true,
      vectorSpecific: false,
      enabled: true
    });

    // Rule 3: Temporal Coherence
    this.registerRule({
      ruleId: 'temporal_coherence',
      name: 'Temporal Coherence',
      description: 'Signals must occur within reasonable time window',
      requiredTier: SourceTier.TIER_3_SUPPLEMENTARY,
      minimumSignals: 2,
      temporalWindow: 72,
      crossSourceRequired: false,
      vectorSpecific: false,
      enabled: true
    });

    // Rule 4: Critical Event Enhanced Validation
    this.registerRule({
      ruleId: 'critical_validation',
      name: 'Critical Event Enhanced Validation',
      description: 'Critical events require Tier 1 source and 3+ signals',
      requiredTier: SourceTier.TIER_1_AUTHORITATIVE,
      minimumSignals: 3,
      temporalWindow: 72,
      crossSourceRequired: true,
      vectorSpecific: false,
      enabled: true
    });

    // Rule 5: Vector Alignment
    this.registerRule({
      ruleId: 'vector_alignment',
      name: 'Vector Alignment',
      description: 'Signals must align with source primary vectors',
      requiredTier: SourceTier.TIER_3_SUPPLEMENTARY,
      minimumSignals: 1,
      temporalWindow: 72,
      crossSourceRequired: false,
      vectorSpecific: true,
      enabled: true
    });
  }

  /**
   * Register a gating rule
   */
  registerRule(rule: GatingRule): void {
    this.rules.set(rule.ruleId, rule);
  }

  /**
   * Validate candidate against all gating rules
   */
  validateCandidate(candidate: EventCandidate): GatingResult {
    const ruleResults: Record<string, boolean> = {};
    const failureReasons: string[] = [];
    let totalWeight = 0;
    let passedWeight = 0;

    // Apply each enabled rule
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Skip critical validation for non-critical events
      if (
        rule.ruleId === 'critical_validation' &&
        candidate.escalationLevel !== EscalationLevel.CRITICAL
      ) {
        continue;
      }

      const passed = this.applyRule(rule, candidate);
      ruleResults[rule.ruleId] = passed;

      // Weight rules differently
      const weight = rule.ruleId === 'critical_validation' ? 2 : 1;
      totalWeight += weight;
      if (passed) {
        passedWeight += weight;
      } else {
        failureReasons.push(`Failed: ${rule.name} - ${rule.description}`);
      }
    }

    // Calculate confidence
    const confidence = totalWeight > 0 ? passedWeight / totalWeight : 0;
    const passed = confidence >= 0.75; // 75% threshold

    return {
      passed,
      ruleResults,
      failureReasons,
      confidence
    };
  }

  /**
   * Apply a specific gating rule
   */
  private applyRule(rule: GatingRule, candidate: EventCandidate): boolean {
    switch (rule.ruleId) {
      case 'tier_validation':
        return this.validateTier(candidate, rule);
      case 'cross_source_confirmation':
        return this.validateCrossSource(candidate, rule);
      case 'temporal_coherence':
        return this.validateTemporalCoherence(candidate, rule);
      case 'critical_validation':
        return this.validateCriticalEvent(candidate, rule);
      case 'vector_alignment':
        return this.validateVectorAlignment(candidate, rule);
      default:
        return false;
    }
  }

  /**
   * Validate source tier requirement
   */
  private validateTier(candidate: EventCandidate, rule: GatingRule): boolean {
    const tierHierarchy = {
      [SourceTier.TIER_1_AUTHORITATIVE]: 3,
      [SourceTier.TIER_2_REPUTABLE]: 2,
      [SourceTier.TIER_3_SUPPLEMENTARY]: 1
    };

    const requiredLevel = tierHierarchy[rule.requiredTier];

    for (const signal of candidate.supportingSignals) {
      const signalLevel = tierHierarchy[signal.sourceTier];
      if (signalLevel >= requiredLevel) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validate cross-source confirmation
   */
  private validateCrossSource(candidate: EventCandidate, rule: GatingRule): boolean {
    if (candidate.supportingSignals.length < rule.minimumSignals) {
      return false;
    }

    // Check for independent sources
    const uniqueSources = new Set(
      candidate.supportingSignals.map(s => s.sourceId)
    );

    return uniqueSources.size >= rule.minimumSignals;
  }

  /**
   * Validate temporal coherence
   */
  private validateTemporalCoherence(candidate: EventCandidate, rule: GatingRule): boolean {
    if (candidate.supportingSignals.length < 2) {
      return true; // Single signal passes by default
    }

    const timestamps = candidate.supportingSignals.map(s => s.timestamp.getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const windowMs = rule.temporalWindow * 60 * 60 * 1000; // hours to ms

    return (maxTime - minTime) <= windowMs;
  }

  /**
   * Validate critical event requirements
   */
  private validateCriticalEvent(candidate: EventCandidate, rule: GatingRule): boolean {
    // Must have Tier 1 source
    const hasTier1 = candidate.supportingSignals.some(
      s => s.sourceTier === SourceTier.TIER_1_AUTHORITATIVE
    );

    if (!hasTier1) {
      return false;
    }

    // Must have minimum signals
    if (candidate.supportingSignals.length < rule.minimumSignals) {
      return false;
    }

    // Must have cross-source confirmation
    const uniqueSources = new Set(
      candidate.supportingSignals.map(s => s.sourceId)
    );

    return uniqueSources.size >= 2;
  }

  /**
   * Validate vector alignment
   */
  private validateVectorAlignment(candidate: EventCandidate, rule: GatingRule): boolean {
    for (const signal of candidate.supportingSignals) {
      const source = sourceRegistry.getSource(signal.sourceId);
      if (!source) continue;

      // Check if signal vector matches source primary vectors
      if (!source.primaryVectors.includes(signal.vector)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all rules
   */
  getRules(): GatingRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): GatingRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Enable/disable rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }
}

// Singleton instance
export const gatingOrchestrator = new GatingOrchestrator();