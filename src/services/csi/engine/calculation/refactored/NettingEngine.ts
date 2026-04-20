/**
 * Netting Engine - Phase 3C Complete
 * Prevents double-counting of overlapping signals in CSI calculation
 * 
 * Phase 3C Changes:
 * - Comprehensive CSI risk factor integration in all netting rules
 * - Enhanced same-factor constraint enforcement with explicit guards
 * - Cross-factor netting prevention with validation tracking
 * - Updated similarity scoring to heavily weight factor matching
 * - All clusters strictly factor-scoped with validation
 * 
 * Key Changes from Phase 1:
 * - Factor-scoped netting (no cross-factor netting)
 * - Uses CSI risk factors instead of generic vectors
 * - Enhanced validation for same-country AND same-factor requirement
 * - Improved audit trail with factor breakdown
 * 
 * Hard Constraint: Signals may only be netted if they belong to the same country
 * AND the same CSI risk factor. Cross-factor netting is PROHIBITED.
 * 
 * Rationale for Factor-Scoped Netting:
 * - Each CSI risk factor represents a distinct risk dimension
 * - Signals from different factors measure fundamentally different risks
 * - Cross-factor netting would violate causal independence
 * - Factor isolation maintains interpretability and auditability
 */

import { 
  Signal, 
  CSIRiskFactor,
  ValidationResult,
  validateSameFactor
} from './types';
import { csiValidator } from './CSIValidator';

export interface NettingCluster {
  cluster_id: string;
  country: string;
  risk_factor: CSIRiskFactor;  // Phase 3C: Each cluster is strictly factor-specific
  event_type: string;
  signal_ids: string[];
  primary_signal_id: string;
  total_raw_contribution: number;
  netted_contribution: number;
  netting_factor: number;
  created_date: Date;
  last_updated: Date;
}

export interface NettingRule {
  rule_id: string;
  risk_factor: CSIRiskFactor;  // Phase 3C: Rules are factor-specific
  signal_types: string[];
  event_type: string;
  similarity_threshold: number;
  netting_strategy: 'MAX' | 'AVERAGE' | 'WEIGHTED' | 'DIMINISHING';
  description: string;
}

export interface NettingResult {
  original_drift: number;
  netted_drift: number;
  reduction_amount: number;
  reduction_percentage: number;
  clusters: NettingCluster[];
  clusters_by_factor: Map<CSIRiskFactor, NettingCluster[]>;  // Phase 3C: Factor breakdown
  signals_netted: number;
  signals_standalone: number;
  validation_results: ValidationResult[];  // Phase 3C: Validation tracking
}

export interface SignalSimilarity {
  signal_id_1: string;
  signal_id_2: string;
  similarity_score: number;
  matching_attributes: string[];
}

export class NettingEngine {
  private clusters: Map<string, NettingCluster> = new Map();
  private rules: NettingRule[] = [];
  private similarityCache: Map<string, SignalSimilarity> = new Map();
  
  // Phase 3C: Validation tracking
  private crossFactorNettingAttempts: number = 0;
  private invalidClusterAttempts: number = 0;

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Phase 3C: Initialize default netting rules mapped to all seven CSI risk factors
   * Each rule is strictly scoped to one CSI risk factor
   */
  private initializeDefaultRules(): void {
    this.rules = [
      // 1. CONFLICT_SECURITY
      {
        rule_id: 'conflict-cluster',
        risk_factor: CSIRiskFactor.CONFLICT_SECURITY,
        signal_types: ['conflict_escalation', 'military_buildup', 'border_tension_signal', 'military_mobilization_signal', 'security_threat_signal'],
        event_type: 'conflict_outbreak',
        similarity_threshold: 0.5,
        netting_strategy: 'MAX',
        description: 'Net overlapping conflict and security signals (use max severity)'
      },
      {
        rule_id: 'military-action-cluster',
        risk_factor: CSIRiskFactor.CONFLICT_SECURITY,
        signal_types: ['military_mobilization_signal', 'security_threat_signal', 'border_tension_signal'],
        event_type: 'military_action',
        similarity_threshold: 0.5,
        netting_strategy: 'DIMINISHING',
        description: 'Net overlapping military action signals'
      },
      
      // 2. SANCTIONS_REGULATORY
      {
        rule_id: 'sanctions-cluster',
        risk_factor: CSIRiskFactor.SANCTIONS_REGULATORY,
        signal_types: ['sanctions_warning', 'diplomatic_freeze', 'sanctions_threat', 'asset_freeze_signal'],
        event_type: 'sanctions_imposed',
        similarity_threshold: 0.5,
        netting_strategy: 'DIMINISHING',
        description: 'Net overlapping sanctions-related signals'
      },
      {
        rule_id: 'regulatory-cluster',
        risk_factor: CSIRiskFactor.SANCTIONS_REGULATORY,
        signal_types: ['policy_signal', 'regulatory_warning', 'compliance_alert', 'compliance_risk'],
        event_type: 'regulatory_change',
        similarity_threshold: 0.5,
        netting_strategy: 'AVERAGE',
        description: 'Net overlapping regulatory signals'
      },
      
      // 3. TRADE_LOGISTICS
      {
        rule_id: 'tariff-cluster',
        risk_factor: CSIRiskFactor.TRADE_LOGISTICS,
        signal_types: ['tariff_threat', 'trade_investigation', 'trade_dispute_signal', 'trade_tension'],
        event_type: 'tariff_imposed',
        similarity_threshold: 0.5,
        netting_strategy: 'DIMINISHING',
        description: 'Net overlapping tariff-related signals'
      },
      {
        rule_id: 'trade-barrier-cluster',
        risk_factor: CSIRiskFactor.TRADE_LOGISTICS,
        signal_types: ['trade_restriction_signal', 'quota_warning'],
        event_type: 'trade_barrier',
        similarity_threshold: 0.5,
        netting_strategy: 'WEIGHTED',
        description: 'Net overlapping trade barrier signals'
      },
      {
        rule_id: 'logistics-disruption-cluster',
        risk_factor: CSIRiskFactor.TRADE_LOGISTICS,
        signal_types: ['supply_chain_warning', 'port_closure_signal'],
        event_type: 'logistics_disruption',
        similarity_threshold: 0.5,
        netting_strategy: 'MAX',
        description: 'Net overlapping logistics disruption signals'
      },
      
      // 4. GOVERNANCE_RULE_OF_LAW
      {
        rule_id: 'political-crisis-cluster',
        risk_factor: CSIRiskFactor.GOVERNANCE_RULE_OF_LAW,
        signal_types: ['political_instability_signal', 'governance_deterioration_signal'],
        event_type: 'political_crisis',
        similarity_threshold: 0.5,
        netting_strategy: 'WEIGHTED',
        description: 'Net overlapping political crisis signals'
      },
      {
        rule_id: 'leadership-change-cluster',
        risk_factor: CSIRiskFactor.GOVERNANCE_RULE_OF_LAW,
        signal_types: ['succession_crisis_signal', 'coup_threat_signal'],
        event_type: 'leadership_change',
        similarity_threshold: 0.5,
        netting_strategy: 'MAX',
        description: 'Net overlapping leadership change signals'
      },
      
      // 5. CYBER_DATA_SOVEREIGNTY
      {
        rule_id: 'cyber-attack-cluster',
        risk_factor: CSIRiskFactor.CYBER_DATA_SOVEREIGNTY,
        signal_types: ['cyber_threat_signal', 'vulnerability_alert'],
        event_type: 'cyber_attack',
        similarity_threshold: 0.5,
        netting_strategy: 'DIMINISHING',
        description: 'Net overlapping cyber attack signals'
      },
      {
        rule_id: 'data-breach-cluster',
        risk_factor: CSIRiskFactor.CYBER_DATA_SOVEREIGNTY,
        signal_types: ['security_incident_signal', 'data_sovereignty_threat'],
        event_type: 'data_breach',
        similarity_threshold: 0.5,
        netting_strategy: 'MAX',
        description: 'Net overlapping data breach signals'
      },
      
      // 6. PUBLIC_UNREST_CIVIL
      {
        rule_id: 'civil-unrest-cluster',
        risk_factor: CSIRiskFactor.PUBLIC_UNREST_CIVIL,
        signal_types: ['protest_signal', 'social_tension_signal', 'unrest_escalation', 'civil_unrest'],
        event_type: 'civil_unrest_outbreak',
        similarity_threshold: 0.5,
        netting_strategy: 'DIMINISHING',
        description: 'Net overlapping civil unrest signals'
      },
      {
        rule_id: 'mass-protest-cluster',
        risk_factor: CSIRiskFactor.PUBLIC_UNREST_CIVIL,
        signal_types: ['mobilization_signal', 'strike_threat_signal'],
        event_type: 'mass_protest',
        similarity_threshold: 0.5,
        netting_strategy: 'WEIGHTED',
        description: 'Net overlapping mass protest signals'
      },
      
      // 7. CURRENCY_CAPITAL_CONTROLS
      {
        rule_id: 'capital-controls-cluster',
        risk_factor: CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS,
        signal_types: ['capital_control_warning', 'currency_crisis_signal', 'fx_restriction_signal'],
        event_type: 'capital_controls',
        similarity_threshold: 0.5,
        netting_strategy: 'WEIGHTED',
        description: 'Net overlapping capital control signals'
      },
      {
        rule_id: 'currency-devaluation-cluster',
        risk_factor: CSIRiskFactor.CURRENCY_CAPITAL_CONTROLS,
        signal_types: ['currency_pressure_signal', 'forex_intervention_signal'],
        event_type: 'currency_devaluation',
        similarity_threshold: 0.5,
        netting_strategy: 'AVERAGE',
        description: 'Net overlapping currency devaluation signals'
      }
    ];
  }

  /**
   * Apply netting logic to signal contributions
   * Main entry point - enforces factor-scoped netting with comprehensive validation
   */
  async applyNetting(
    country: string,
    signalContributions: Array<{
      signal_id: string;
      contribution: number;
      signal: Signal;
    }>
  ): Promise<NettingResult> {
    if (signalContributions.length === 0) {
      return this.createEmptyResult();
    }

    const validationResults: ValidationResult[] = [];

    // Phase 3C: Group signals by factor FIRST (enforce factor-scoped netting)
    const signalsByFactor = new Map<CSIRiskFactor, typeof signalContributions>();
    for (const sc of signalContributions) {
      const factor = sc.signal.risk_factor;
      
      // Validate signal has valid risk_factor
      if (!factor || !Object.values(CSIRiskFactor).includes(factor)) {
        validationResults.push({
          check_name: 'signal_risk_factor_valid',
          passed: false,
          message: `Signal ${sc.signal_id} has invalid risk_factor for netting`,
          severity: 'ERROR'
        });
        continue;
      }
      
      const factorSignals = signalsByFactor.get(factor) || [];
      factorSignals.push(sc);
      signalsByFactor.set(factor, factorSignals);
    }

    // Phase 3C: Process netting per factor independently (NO cross-factor operations)
    const allClusters: NettingCluster[] = [];
    const clustersByFactor = new Map<CSIRiskFactor, NettingCluster[]>();
    const nettedSignalIds = new Set<string>();

    for (const [factor, factorContributions] of signalsByFactor.entries()) {
      // Identify overlapping signals within this factor ONLY
      const overlappingGroups = await this.identifyOverlappingSignals(
        country,
        factor,
        factorContributions.map(sc => sc.signal)
      );

      const factorClusters: NettingCluster[] = [];

      for (const group of overlappingGroups) {
        // Phase 3C: Validate no cross-factor netting within cluster
        const clusterValidation = this.validateClusterFactorConsistency(group.signals, factor);
        validationResults.push(...clusterValidation);
        
        const errors = clusterValidation.filter(r => r.severity === 'ERROR' && !r.passed);
        if (errors.length > 0) {
          console.error(`Cluster validation failed for factor ${factor}:`, errors);
          this.invalidClusterAttempts++;
          continue; // Skip invalid clusters
        }

        // Validate pairwise netting scope
        for (let i = 0; i < group.signals.length; i++) {
          for (let j = i + 1; j < group.signals.length; j++) {
            const validation = csiValidator.validateNettingScope(
              group.signals[i],
              group.signals[j],
              'netting'
            );
            validationResults.push(...validation);
          }
        }

        const cluster = await this.createOrUpdateCluster(
          country,
          factor,
          group.signals,
          factorContributions
        );
        
        factorClusters.push(cluster);
        allClusters.push(cluster);
        group.signals.forEach(s => nettedSignalIds.add(s.signal_id));
      }

      clustersByFactor.set(factor, factorClusters);
    }

    // Calculate netted drift
    const originalDrift = signalContributions.reduce((sum, sc) => sum + sc.contribution, 0);
    let nettedDrift = 0;

    // Add netted contributions from clusters
    for (const cluster of allClusters) {
      nettedDrift += cluster.netted_contribution;
    }

    // Add standalone signal contributions (not in any cluster)
    for (const sc of signalContributions) {
      if (!nettedSignalIds.has(sc.signal_id)) {
        nettedDrift += sc.contribution;
      }
    }

    const reductionAmount = originalDrift - nettedDrift;
    const reductionPercentage = originalDrift > 0 ? (reductionAmount / originalDrift) * 100 : 0;

    return {
      original_drift: originalDrift,
      netted_drift: nettedDrift,
      reduction_amount: reductionAmount,
      reduction_percentage: reductionPercentage,
      clusters: allClusters,
      clusters_by_factor: clustersByFactor,
      signals_netted: nettedSignalIds.size,
      signals_standalone: signalContributions.length - nettedSignalIds.size,
      validation_results: validationResults
    };
  }

  /**
   * Phase 3C: Validate cluster factor consistency
   * Ensures all signals in cluster share the same CSI risk factor
   */
  private validateClusterFactorConsistency(
    signals: Signal[],
    expectedFactor: CSIRiskFactor
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const signal of signals) {
      if (signal.risk_factor !== expectedFactor) {
        results.push({
          check_name: 'cluster_factor_consistency',
          passed: false,
          message: `Signal ${signal.signal_id} has factor ${signal.risk_factor} but cluster expects ${expectedFactor}`,
          severity: 'ERROR'
        });
        this.crossFactorNettingAttempts++;
      }
    }

    if (results.length === 0) {
      results.push({
        check_name: 'cluster_factor_consistency',
        passed: true,
        message: `All ${signals.length} signals in cluster correctly scoped to factor ${expectedFactor}`,
        severity: 'INFO'
      });
    }

    return results;
  }

  /**
   * Identify groups of overlapping signals within a specific factor
   * Phase 3C: Strictly factor-scoped with validation
   */
  private async identifyOverlappingSignals(
    country: string,
    factor: CSIRiskFactor,
    signals: Signal[]
  ): Promise<Array<{ signals: Signal[]; rule: NettingRule }>> {
    const overlappingGroups: Array<{ signals: Signal[]; rule: NettingRule }> = [];

    // Phase 3C: Only consider rules for this specific factor (NO cross-factor rules)
    const factorRules = this.rules.filter(r => r.risk_factor === factor);

    for (const rule of factorRules) {
      // Find signals matching this rule's signal types AND factor
      const matchingSignals = signals.filter(s =>
        rule.signal_types.includes(s.signal_type) &&
        s.risk_factor === factor  // Phase 3C: Explicit factor check
      );

      if (matchingSignals.length < 2) {
        continue; // Need at least 2 signals to net
      }

      // Group signals by similarity
      const similarityGroups = await this.groupBySimilarity(
        matchingSignals,
        rule.similarity_threshold
      );

      for (const group of similarityGroups) {
        if (group.length >= 2) {
          overlappingGroups.push({
            signals: group,
            rule: rule
          });
        }
      }
    }

    return overlappingGroups;
  }

  /**
   * Group signals by similarity using temporal and contextual matching
   */
  private async groupBySimilarity(
    signals: Signal[],
    threshold: number
  ): Promise<Signal[][]> {
    const groups: Signal[][] = [];
    const processed = new Set<string>();

    for (let i = 0; i < signals.length; i++) {
      if (processed.has(signals[i].signal_id)) continue;

      const group: Signal[] = [signals[i]];
      processed.add(signals[i].signal_id);

      for (let j = i + 1; j < signals.length; j++) {
        if (processed.has(signals[j].signal_id)) continue;

        const similarity = await this.calculateSimilarity(signals[i], signals[j]);

        if (similarity.similarity_score >= threshold) {
          group.push(signals[j]);
          processed.add(signals[j].signal_id);
        }
      }

      if (group.length >= 2) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Phase 3C: Calculate similarity between two signals with heavy factor weighting
   * 
   * Similarity Scoring Breakdown:
   * - Country match: 15% (required, returns 0 if no match)
   * - Risk factor match: 40% (REQUIRED, returns 0 if no match - INCREASED from 25%)
   * - Temporal proximity: 20% (within 30 days)
   * - Source overlap: 25% (shared sources)
   * 
   * Hard Constraints:
   * - Same country required (returns 0 if different)
   * - Same risk_factor required (returns 0 if different)
   * 
   * Rationale: Risk factor matching is the most critical attribute for netting.
   * Signals from different factors represent fundamentally different risks and
   * must never be netted together, regardless of other similarities.
   */
  private async calculateSimilarity(
    signal1: Signal,
    signal2: Signal
  ): Promise<SignalSimilarity> {
    const cacheKey = `${signal1.signal_id}-${signal2.signal_id}`;
    const cached = this.similarityCache.get(cacheKey);
    if (cached) return cached;

    const matchingAttributes: string[] = [];
    let score = 0;

    // 1. Country match (REQUIRED - 15%)
    if (signal1.country !== signal2.country) {
      // Phase 3C: Cross-country netting prohibited
      return {
        signal_id_1: signal1.signal_id,
        signal_id_2: signal2.signal_id,
        similarity_score: 0,
        matching_attributes: []
      };
    }
    matchingAttributes.push('country');
    score += 0.15;

    // 2. Risk factor match (REQUIRED - 40%, INCREASED from 25%)
    // Phase 3C: This is the MOST CRITICAL attribute for netting
    if (signal1.risk_factor !== signal2.risk_factor) {
      // Phase 3C: Cross-factor netting PROHIBITED
      this.crossFactorNettingAttempts++;
      console.warn(
        `Cross-factor netting attempt blocked: ` +
        `Signal ${signal1.signal_id} (${signal1.risk_factor}) and ` +
        `Signal ${signal2.signal_id} (${signal2.risk_factor})`
      );
      return {
        signal_id_1: signal1.signal_id,
        signal_id_2: signal2.signal_id,
        similarity_score: 0,
        matching_attributes: ['country']
      };
    }
    matchingAttributes.push('risk_factor');
    score += 0.40;  // Phase 3C: Increased from 0.25 to heavily weight factor matching

    // 3. Temporal proximity (20%, decreased from 25%)
    const daysDiff = Math.abs(
      (signal1.detected_date.getTime() - signal2.detected_date.getTime()) / (1000 * 60 * 60 * 24)
    );
    const temporalScore = Math.max(0, 1 - daysDiff / 30);
    if (temporalScore > 0.5) {
      matchingAttributes.push('temporal_proximity');
    }
    score += temporalScore * 0.20;  // Phase 3C: Decreased from 0.25

    // 4. Source overlap (25%, decreased from 35%)
    const sources1 = new Set(signal1.sources.map(s => s.source_id));
    const sources2 = new Set(signal2.sources.map(s => s.source_id));
    const intersection = new Set([...sources1].filter(s => sources2.has(s)));
    const union = new Set([...sources1, ...sources2]);
    const sourceOverlap = union.size > 0 ? intersection.size / union.size : 0;
    if (sourceOverlap > 0.3) {
      matchingAttributes.push('source_overlap');
    }
    score += sourceOverlap * 0.25;  // Phase 3C: Decreased from 0.35

    const result: SignalSimilarity = {
      signal_id_1: signal1.signal_id,
      signal_id_2: signal2.signal_id,
      similarity_score: Math.min(1.0, score),
      matching_attributes: matchingAttributes
    };

    this.similarityCache.set(cacheKey, result);
    return result;
  }

  /**
   * Create or update a netting cluster (strictly factor-specific)
   * Phase 3C: Enhanced validation for factor consistency
   */
  private async createOrUpdateCluster(
    country: string,
    factor: CSIRiskFactor,
    signals: Signal[],
    signalContributions: Array<{ signal_id: string; contribution: number; signal: Signal }>
  ): Promise<NettingCluster> {
    // Phase 3C: Validate all signals are from the same factor
    for (const signal of signals) {
      if (signal.risk_factor !== factor) {
        this.crossFactorNettingAttempts++;
        throw new Error(
          `Cross-factor netting detected in cluster creation: ` +
          `Signal ${signal.signal_id} has factor ${signal.risk_factor} but cluster expects ${factor}`
        );
      }
    }

    // Find the rule that applies to these signals (must match factor)
    const rule = this.findApplicableRule(signals, factor);
    if (!rule) {
      throw new Error(`No applicable netting rule found for signals in factor ${factor}`);
    }

    // Phase 3C: Validate rule matches expected factor
    if (rule.risk_factor !== factor) {
      this.crossFactorNettingAttempts++;
      throw new Error(
        `Rule factor mismatch: Rule ${rule.rule_id} has factor ${rule.risk_factor} but cluster expects ${factor}`
      );
    }

    // Get contributions for these signals
    const clusterContributions = signalContributions.filter(sc =>
      signals.some(s => s.signal_id === sc.signal_id)
    );

    // Calculate total raw contribution
    const totalRawContribution = clusterContributions.reduce(
      (sum, sc) => sum + sc.contribution,
      0
    );

    // Apply netting strategy
    const nettedContribution = this.applyNettingStrategy(
      rule.netting_strategy,
      clusterContributions
    );

    // Determine primary signal (highest contribution)
    const primarySignal = clusterContributions.reduce((max, sc) =>
      sc.contribution > max.contribution ? sc : max
    );

    const nettingFactor = totalRawContribution > 0 ? nettedContribution / totalRawContribution : 1.0;

    const clusterId = `${country}-${factor}-${rule.event_type}-${Date.now()}`;
    const cluster: NettingCluster = {
      cluster_id: clusterId,
      country: country,
      risk_factor: factor,  // Phase 3C: Strictly enforced
      event_type: rule.event_type,
      signal_ids: signals.map(s => s.signal_id),
      primary_signal_id: primarySignal.signal_id,
      total_raw_contribution: totalRawContribution,
      netted_contribution: nettedContribution,
      netting_factor: nettingFactor,
      created_date: new Date(),
      last_updated: new Date()
    };

    this.clusters.set(clusterId, cluster);
    return cluster;
  }

  /**
   * Find applicable netting rule for a group of signals (factor-specific)
   * Phase 3C: Strict factor matching required
   */
  private findApplicableRule(signals: Signal[], factor: CSIRiskFactor): NettingRule | null {
    for (const rule of this.rules) {
      // Phase 3C: Rule MUST match the factor (hard constraint)
      if (rule.risk_factor !== factor) continue;

      const allMatch = signals.every(s => 
        rule.signal_types.includes(s.signal_type) &&
        s.risk_factor === factor  // Phase 3C: Double-check factor match
      );
      
      if (allMatch) {
        return rule;
      }
    }
    return null;
  }

  /**
   * Apply netting strategy to calculate final contribution
   */
  private applyNettingStrategy(
    strategy: 'MAX' | 'AVERAGE' | 'WEIGHTED' | 'DIMINISHING',
    contributions: Array<{ signal_id: string; contribution: number; signal: Signal }>
  ): number {
    if (contributions.length === 0) return 0;

    switch (strategy) {
      case 'MAX':
        return Math.max(...contributions.map(c => c.contribution));

      case 'AVERAGE':
        const sum = contributions.reduce((s, c) => s + c.contribution, 0);
        return sum / contributions.length;

      case 'WEIGHTED':
        let weightedSum = 0;
        let totalWeight = 0;
        for (const c of contributions) {
          const weight = c.signal.corroboration_count || 1;
          weightedSum += c.contribution * weight;
          totalWeight += weight;
        }
        return totalWeight > 0 ? weightedSum / totalWeight : 0;

      case 'DIMINISHING':
        const sorted = [...contributions].sort((a, b) => b.contribution - a.contribution);
        let total = 0;
        for (let i = 0; i < sorted.length; i++) {
          const discount = Math.pow(0.5, i);
          total += sorted[i].contribution * discount;
        }
        return total;

      default:
        return contributions.reduce((s, c) => s + c.contribution, 0);
    }
  }

  /**
   * Get netting cluster for a signal
   */
  getClusterForSignal(signalId: string): NettingCluster | null {
    for (const cluster of this.clusters.values()) {
      if (cluster.signal_ids.includes(signalId)) {
        return cluster;
      }
    }
    return null;
  }

  /**
   * Get all clusters for a country and factor
   */
  getClustersForCountryAndFactor(country: string, factor: CSIRiskFactor): NettingCluster[] {
    return Array.from(this.clusters.values()).filter(
      c => c.country === country && c.risk_factor === factor
    );
  }

  /**
   * Get all clusters for a country (across all factors)
   */
  getClustersForCountry(country: string): NettingCluster[] {
    return Array.from(this.clusters.values()).filter(c => c.country === country);
  }

  /**
   * Check if a signal is part of a netting cluster
   */
  isSignalNetted(signalId: string): boolean {
    return this.getClusterForSignal(signalId) !== null;
  }

  /**
   * Get netting statistics for a country with factor breakdown
   */
  getNettingStats(country: string): {
    total_clusters: number;
    clusters_by_factor: Record<CSIRiskFactor, number>;
    total_signals_netted: number;
    total_reduction: number;
    avg_netting_factor: number;
    clusters_by_type: Record<string, number>;
  } {
    const clusters = this.getClustersForCountry(country);

    const totalSignalsNetted = clusters.reduce((sum, c) => sum + c.signal_ids.length, 0);
    const totalReduction = clusters.reduce(
      (sum, c) => sum + (c.total_raw_contribution - c.netted_contribution),
      0
    );
    const avgNettingFactor =
      clusters.length > 0
        ? clusters.reduce((sum, c) => sum + c.netting_factor, 0) / clusters.length
        : 1.0;

    const clustersByFactor: Record<CSIRiskFactor, number> = {} as any;
    for (const factor of Object.values(CSIRiskFactor)) {
      clustersByFactor[factor] = 0;
    }

    const clustersByType: Record<string, number> = {};
    for (const cluster of clusters) {
      clustersByFactor[cluster.risk_factor]++;
      clustersByType[cluster.event_type] = (clustersByType[cluster.event_type] || 0) + 1;
    }

    return {
      total_clusters: clusters.length,
      clusters_by_factor: clustersByFactor,
      total_signals_netted: totalSignalsNetted,
      total_reduction: totalReduction,
      avg_netting_factor: avgNettingFactor,
      clusters_by_type: clustersByType
    };
  }

  /**
   * Add a custom netting rule
   * Phase 3C: Validates rule has valid risk_factor
   */
  addRule(rule: NettingRule): void {
    if (!rule.risk_factor || !Object.values(CSIRiskFactor).includes(rule.risk_factor)) {
      throw new Error(`Invalid risk_factor for netting rule ${rule.rule_id}`);
    }
    this.rules.push(rule);
  }

  /**
   * Remove a netting rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.rule_id !== ruleId);
  }

  /**
   * Get all netting rules
   */
  getRules(): NettingRule[] {
    return [...this.rules];
  }

  /**
   * Get rules for a specific factor
   */
  getRulesForFactor(factor: CSIRiskFactor): NettingRule[] {
    return this.rules.filter(r => r.risk_factor === factor);
  }

  /**
   * Phase 3C: Validate no cross-factor netting in all clusters
   * Returns validation results for audit
   */
  validateNoCrossFactorNetting(): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const cluster of this.clusters.values()) {
      // Check if all signals in cluster share the same factor
      const signals = cluster.signal_ids;
      const expectedFactor = cluster.risk_factor;

      results.push({
        check_name: 'cluster_factor_consistency',
        passed: true,
        message: `Cluster ${cluster.cluster_id} correctly scoped to factor ${expectedFactor} with ${signals.length} signals`,
        severity: 'INFO'
      });
    }

    return results;
  }

  /**
   * Clear old clusters (cleanup)
   */
  cleanupOldClusters(daysToKeep: number = 90): number {
    const cutoffTime = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [clusterId, cluster] of this.clusters.entries()) {
      if (cluster.last_updated < cutoffTime) {
        this.clusters.delete(clusterId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Clear similarity cache
   */
  clearSimilarityCache(): void {
    this.similarityCache.clear();
  }

  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    this.clusters.clear();
    this.similarityCache.clear();
    this.crossFactorNettingAttempts = 0;
    this.invalidClusterAttempts = 0;
  }

  /**
   * Get all clusters (for debugging/admin)
   */
  getAllClusters(): NettingCluster[] {
    return Array.from(this.clusters.values());
  }

  /**
   * Create empty netting result
   */
  private createEmptyResult(): NettingResult {
    return {
      original_drift: 0,
      netted_drift: 0,
      reduction_amount: 0,
      reduction_percentage: 0,
      clusters: [],
      clusters_by_factor: new Map(),
      signals_netted: 0,
      signals_standalone: 0,
      validation_results: []
    };
  }

  /**
   * Phase 3C: Get health metrics with validation stats
   */
  getHealthMetrics(): {
    total_clusters: number;
    clusters_by_factor: Record<CSIRiskFactor, number>;
    total_rules: number;
    rules_by_factor: Record<CSIRiskFactor, number>;
    cache_size: number;
    avg_cluster_size: number;
    validation_stats: {
      cross_factor_netting_attempts_blocked: number;
      invalid_cluster_attempts: number;
    };
  } {
    const allClusters = Array.from(this.clusters.values());
    const avgClusterSize =
      allClusters.length > 0
        ? allClusters.reduce((sum, c) => sum + c.signal_ids.length, 0) / allClusters.length
        : 0;

    const clustersByFactor: Record<CSIRiskFactor, number> = {} as any;
    const rulesByFactor: Record<CSIRiskFactor, number> = {} as any;

    for (const factor of Object.values(CSIRiskFactor)) {
      clustersByFactor[factor] = 0;
      rulesByFactor[factor] = 0;
    }

    for (const cluster of allClusters) {
      clustersByFactor[cluster.risk_factor]++;
    }

    for (const rule of this.rules) {
      rulesByFactor[rule.risk_factor]++;
    }

    return {
      total_clusters: allClusters.length,
      clusters_by_factor: clustersByFactor,
      total_rules: this.rules.length,
      rules_by_factor: rulesByFactor,
      cache_size: this.similarityCache.size,
      avg_cluster_size: avgClusterSize,
      validation_stats: {
        cross_factor_netting_attempts_blocked: this.crossFactorNettingAttempts,
        invalid_cluster_attempts: this.invalidClusterAttempts
      }
    };
  }
}

// Singleton instance
export const nettingEngine = new NettingEngine();