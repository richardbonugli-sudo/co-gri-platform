/**
 * Refactored CSI Engine Orchestrator
 * Integrates the new three-component architecture into the existing workflow
 * Part of Phase 1: Core Architecture Redesign
 */

import {
  EscalationSignal,
  EventCandidate,
  EventStatus,
  EscalationLevel,
  RiskVector
} from './types';
import { escalationSignalLog } from './state/EscalationSignalLog';
import { eventCandidateStore } from './state/EventCandidateStore';
import { eventDeltaLedger } from './state/EventDeltaLedger';
import { sourceRegistry } from './sources/SourceRegistry';
import { gatingOrchestrator } from './gating/GatingOrchestrator';
import { baselineCalculator } from './calculation/BaselineCalculator';
import { decayEngine } from './calculation/DecayEngine';

// Import refactored engines
import { 
  refactoredCSIEngine,
  structuralBaselineEngine,
  escalationDriftEngine,
  eventDeltaEngine
} from './calculation/refactored';

export class RefactoredCSIEngineOrchestrator {
  private initialized = false;
  private useRefactoredEngine = true; // Toggle to switch between old and new engine

  /**
   * Initialize the CSI Engine
   */
  async initialize(countries: string[]): Promise<void> {
    if (this.initialized) {
      console.log('✅ CSI Engine already initialized');
      return;
    }

    console.log('🚀 Initializing Refactored CSI Engine...');

    // Seed baselines for countries
    console.log('📊 Seeding baselines...');
    await baselineCalculator.seedBaselines(countries);

    // Calculate initial CSI scores using refactored engine
    console.log('🔢 Calculating initial CSI scores...');
    await refactoredCSIEngine.recalculateAll(countries);

    this.initialized = true;
    console.log('✅ Refactored CSI Engine initialized successfully');
    console.log(`📈 Calculated CSI for ${countries.length} countries`);
  }

  /**
   * Process incoming escalation signal
   * Main workflow: Signal → Candidate → Validation → Delta → CSI Update
   */
  async processSignal(signal: EscalationSignal): Promise<{
    signalId: string;
    candidateCreated: boolean;
    candidateId?: string;
    validated: boolean;
    csiUpdated: boolean;
    csiComponents?: {
      baseline: number;
      drift: number;
      delta: number;
      total: number;
    };
  }> {
    console.log(`📥 Processing signal: ${signal.signalId} for ${signal.country}`);

    // Step 1: Append signal to log
    escalationSignalLog.append(signal);

    // Step 2: Check if candidate exists for this country/vector
    const existingCandidate = eventCandidateStore.hasActiveCandidate(
      signal.country,
      signal.vector
    );

    let candidateId: string | undefined;
    let candidateCreated = false;

    if (existingCandidate) {
      // Update existing candidate with new signal
      const candidates = eventCandidateStore.getCandidatesByCountry(
        signal.country,
        EventStatus.CANDIDATE,
        signal.vector
      );

      if (candidates.length > 0) {
        const candidate = candidates[0];
        candidate.supportingSignals.push(signal);
        candidate.lastUpdated = new Date();
        candidateId = candidate.candidateId;
        console.log(`📝 Updated existing candidate: ${candidateId}`);
      }
    } else {
      // Create new candidate
      const candidate: EventCandidate = {
        candidateId: `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        country: signal.country,
        vector: signal.vector,
        escalationLevel: signal.escalationLevel,
        supportingSignals: [signal],
        firstDetected: new Date(),
        lastUpdated: new Date(),
        status: EventStatus.CANDIDATE,
        gatingChecks: {
          tierValidation: false,
          crossSourceConfirmation: false,
          temporalCoherence: false,
          vectorAlignment: false
        },
        validationScore: 0
      };

      eventCandidateStore.addCandidate(candidate);
      candidateId = candidate.candidateId;
      candidateCreated = true;
      console.log(`✨ Created new candidate: ${candidateId}`);
    }

    // Step 3: Validate candidate
    let validated = false;
    if (candidateId) {
      validated = await this.validateCandidate(candidateId);
    }

    // Step 4: Recalculate CSI using refactored engine
    let csiUpdated = false;
    let csiComponents;

    if (this.useRefactoredEngine) {
      try {
        const csi = await refactoredCSIEngine.calculateCSI(signal.country);
        csiComponents = {
          baseline: csi.structural_baseline,
          drift: csi.escalation_drift,
          delta: csi.event_delta,
          total: csi.total
        };
        csiUpdated = true;
        console.log(`📊 CSI updated for ${signal.country}: ${csi.total.toFixed(2)} (baseline: ${csi.structural_baseline.toFixed(2)}, drift: ${csi.escalation_drift.toFixed(2)}, delta: ${csi.event_delta.toFixed(2)})`);
      } catch (error) {
        console.error(`❌ Failed to update CSI for ${signal.country}:`, error);
      }
    }

    return {
      signalId: signal.signalId,
      candidateCreated,
      candidateId,
      validated,
      csiUpdated,
      csiComponents
    };
  }

  /**
   * Validate event candidate through gating
   */
  async validateCandidate(candidateId: string): Promise<boolean> {
    const candidate = eventCandidateStore.getCandidate(candidateId);
    if (!candidate) {
      console.warn(`⚠️ Candidate not found: ${candidateId}`);
      return false;
    }

    // Run gating validation
    const gatingResult = gatingOrchestrator.validateCandidate(candidate);

    // Update candidate with gating results
    candidate.gatingChecks = {
      tierValidation: gatingResult.ruleResults['tier_validation'] || false,
      crossSourceConfirmation: gatingResult.ruleResults['cross_source_confirmation'] || false,
      temporalCoherence: gatingResult.ruleResults['temporal_coherence'] || false,
      vectorAlignment: gatingResult.ruleResults['vector_alignment'] || false
    };
    candidate.validationScore = gatingResult.confidence;

    if (gatingResult.passed) {
      console.log(`✅ Candidate validated: ${candidateId} (confidence: ${gatingResult.confidence.toFixed(2)})`);

      // Candidate validated - create event delta
      eventCandidateStore.updateCandidateStatus(candidateId, EventStatus.VALIDATED);

      // Create delta record
      const delta = {
        deltaId: `delta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventId: candidateId,
        timestamp: new Date(),
        country: candidate.country,
        vector: candidate.vector,
        deltaType: 'new' as const,
        newLevel: candidate.escalationLevel,
        triggeringSignals: candidate.supportingSignals.map(s => s.signalId),
        csiImpact: this.calculateImpact(candidate),
        auditTrail: {
          validatedBy: 'system',
          validationTimestamp: new Date(),
          overrideApplied: false
        }
      };

      eventDeltaLedger.recordDelta(delta);

      // Create persistence record
      decayEngine.createPersistence(candidateId, candidate.escalationLevel);

      // Recalculate CSI for affected country using refactored engine
      if (this.useRefactoredEngine) {
        await refactoredCSIEngine.calculateCSI(candidate.country);
      }

      return true;
    } else {
      console.log(`❌ Candidate validation failed: ${candidateId}`, gatingResult.failureReasons);
      return false;
    }
  }

  /**
   * Calculate CSI impact from event
   */
  private calculateImpact(candidate: EventCandidate): {
    vectorDelta: number;
    compositeDelta: number;
  } {
    // Impact based on escalation level
    const impactMap = {
      [EscalationLevel.CRITICAL]: 15,
      [EscalationLevel.HIGH]: 10,
      [EscalationLevel.MODERATE]: 5,
      [EscalationLevel.LOW]: 2
    };

    const vectorDelta = impactMap[candidate.escalationLevel] || 5;

    // Composite delta is weighted by vector importance
    const vectorWeights: Record<RiskVector, number> = {
      [RiskVector.POLITICAL]: 0.20,
      [RiskVector.ECONOMIC]: 0.20,
      [RiskVector.SECURITY]: 0.20,
      [RiskVector.SOCIAL]: 0.15,
      [RiskVector.ENVIRONMENTAL]: 0.15,
      [RiskVector.TECHNOLOGICAL]: 0.10
    };

    const compositeDelta = vectorDelta * (vectorWeights[candidate.vector] || 0.15);

    return { vectorDelta, compositeDelta };
  }

  /**
   * Get CSI score for country (using refactored engine)
   */
  async getCSIScore(country: string): Promise<{
    country: string;
    timestamp: Date;
    compositeScore: number;
    components: {
      baseline: number;
      drift: number;
      delta: number;
    };
    metadata: {
      activeSignals: number;
      confirmedEvents: number;
      confidence: number;
    };
  }> {
    if (this.useRefactoredEngine) {
      const cached = refactoredCSIEngine.getCurrentScore(country);

      if (cached) {
        // Check if score is fresh (< 1 hour old)
        const age = Date.now() - cached.metadata.last_updated.getTime();
        if (age < 60 * 60 * 1000) {
          return {
            country,
            timestamp: cached.metadata.last_updated,
            compositeScore: cached.total,
            components: {
              baseline: cached.structural_baseline,
              drift: cached.escalation_drift,
              delta: cached.event_delta
            },
            metadata: {
              activeSignals: cached.metadata.active_signals.length,
              confirmedEvents: cached.metadata.confirmed_events.length,
              confidence: cached.metadata.confidence_score
            }
          };
        }
      }

      // Recalculate
      const csi = await refactoredCSIEngine.calculateCSI(country);
      return {
        country,
        timestamp: csi.metadata.last_updated,
        compositeScore: csi.total,
        components: {
          baseline: csi.structural_baseline,
          drift: csi.escalation_drift,
          delta: csi.event_delta
        },
        metadata: {
          activeSignals: csi.metadata.active_signals.length,
          confirmedEvents: csi.metadata.confirmed_events.length,
          confidence: csi.metadata.confidence_score
        }
      };
    }

    // Fallback to old engine (should not reach here)
    throw new Error('Old engine not supported in refactored orchestrator');
  }

  /**
   * Get CSI attribution (what moved CSI)
   */
  async getCSIAttribution(country: string) {
    return refactoredCSIEngine.getCSIAttribution(country);
  }

  /**
   * Run maintenance tasks
   */
  async runMaintenance(): Promise<{
    expiredCandidates: number;
    expiredEvents: number;
    prunedSignals: number;
  }> {
    console.log('🧹 Running CSI Engine maintenance...');

    // Expire old candidates (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const expiredCandidates = eventCandidateStore.expireOldCandidates(sevenDaysAgo);

    // Prune expired events
    const expiredEvents = decayEngine.pruneExpiredEvents();

    // Prune old signals (older than 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const prunedSignals = escalationSignalLog.pruneOldSignals(ninetyDaysAgo);

    console.log(`✅ Maintenance complete: ${expiredCandidates} candidates, ${expiredEvents} events, ${prunedSignals} signals`);

    return {
      expiredCandidates,
      expiredEvents,
      prunedSignals
    };
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    initialized: boolean;
    engineType: 'refactored' | 'legacy';
    totalSignals: number;
    activeCandidates: number;
    validatedEvents: number;
    activeCountries: number;
    avgCompositeScore: number;
    avgBaseline: number;
    avgDrift: number;
    avgDelta: number;
  } {
    const signalStats = escalationSignalLog.getStatistics();
    const candidateStats = eventCandidateStore.getStatistics();
    const csiStats = refactoredCSIEngine.getStatistics();

    return {
      initialized: this.initialized,
      engineType: this.useRefactoredEngine ? 'refactored' : 'legacy',
      totalSignals: signalStats.totalSignals,
      activeCandidates: candidateStats.pendingCount,
      validatedEvents: candidateStats.validatedCount,
      activeCountries: csiStats.totalCountries,
      avgCompositeScore: csiStats.avgCompositeScore,
      avgBaseline: csiStats.avgBaseline,
      avgDrift: csiStats.avgDrift,
      avgDelta: csiStats.avgDelta
    };
  }

  /**
   * Generate diagnostic report
   */
  generateDiagnosticReport(): any {
    return {
      timestamp: new Date(),
      systemHealth: this.getSystemHealth(),
      signalLog: escalationSignalLog.getStatistics(),
      candidates: eventCandidateStore.getStatistics(),
      deltas: eventDeltaLedger.getStatistics(),
      decay: decayEngine.getStatistics(),
      csi: refactoredCSIEngine.getStatistics(),
      sources: sourceRegistry.getStatistics(),
      engines: {
        structural_baseline: {
          type: 'StructuralBaselineEngine',
          update_frequency: 'Quarterly (90 days)'
        },
        escalation_drift: {
          type: 'EscalationDriftEngine',
          update_frequency: 'Daily',
          max_drift_per_signal: 0.25,
          max_cumulative_drift_30d: 1.0
        },
        event_delta: {
          type: 'EventDeltaEngine',
          update_frequency: 'Real-time',
          netting_enabled: true,
          decay_type: 'Exponential (30-day half-life)'
        }
      }
    };
  }

  /**
   * Toggle between refactored and legacy engine (for testing)
   */
  setEngineMode(mode: 'refactored' | 'legacy'): void {
    this.useRefactoredEngine = mode === 'refactored';
    console.log(`🔄 Engine mode set to: ${mode}`);
  }
}

// Singleton instance
export const refactoredCSIEngineOrchestrator = new RefactoredCSIEngineOrchestrator();