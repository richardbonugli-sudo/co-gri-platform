/**
 * CSI Engine Orchestrator
 * Main entry point for CSI Engine operations
 */

import { 
  EscalationSignal, 
  EventCandidate, 
  EventStatus, 
  EscalationLevel,
  RiskVector,
  CSIScore
} from './types';
import { escalationSignalLog } from './state/EscalationSignalLog';
import { eventCandidateStore } from './state/EventCandidateStore';
import { eventDeltaLedger } from './state/EventDeltaLedger';
import { sourceRegistry } from './sources/SourceRegistry';
import { gatingOrchestrator } from './gating/GatingOrchestrator';
import { baselineCalculator } from './calculation/BaselineCalculator';
import { decayEngine } from './calculation/DecayEngine';
import { csiEngine } from './calculation/CSIEngine';

export class CSIEngineOrchestrator {
  private initialized = false;

  /**
   * Initialize the CSI Engine
   */
  async initialize(countries: string[]): Promise<void> {
    if (this.initialized) {
      console.log('CSI Engine already initialized');
      return;
    }

    console.log('Initializing CSI Engine...');

    // Seed baselines for countries
    console.log('Seeding baselines...');
    await baselineCalculator.seedBaselines(countries);

    // Calculate initial CSI scores
    console.log('Calculating initial CSI scores...');
    await csiEngine.recalculateAll(countries);

    this.initialized = true;
    console.log('CSI Engine initialized successfully');
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
  }> {
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
    }

    // Step 3: Validate candidate
    let validated = false;
    if (candidateId) {
      validated = await this.validateCandidate(candidateId);
    }

    return {
      signalId: signal.signalId,
      candidateCreated,
      candidateId,
      validated
    };
  }

  /**
   * Validate event candidate through gating
   */
  async validateCandidate(candidateId: string): Promise<boolean> {
    const candidate = eventCandidateStore.getCandidate(candidateId);
    if (!candidate) return false;

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

      // Recalculate CSI for affected country
      await csiEngine.calculateCSI(candidate.country);

      return true;
    } else {
      // Validation failed
      console.log(`Candidate ${candidateId} failed validation:`, gatingResult.failureReasons);
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
   * Get CSI score for country
   */
  async getCSIScore(country: string): Promise<CSIScore> {
    const cached = csiEngine.getCurrentScore(country);
    
    if (cached) {
      // Check if score is fresh (< 1 hour old)
      const age = Date.now() - cached.timestamp.getTime();
      if (age < 60 * 60 * 1000) {
        return cached;
      }
    }

    // Recalculate
    return csiEngine.calculateCSI(country);
  }

  /**
   * Run maintenance tasks
   */
  async runMaintenance(): Promise<{
    expiredCandidates: number;
    expiredEvents: number;
    prunedSignals: number;
  }> {
    console.log('Running CSI Engine maintenance...');

    // Expire old candidates (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const expiredCandidates = eventCandidateStore.expireOldCandidates(sevenDaysAgo);

    // Prune expired events
    const expiredEvents = decayEngine.pruneExpiredEvents();

    // Prune old signals (older than 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const prunedSignals = escalationSignalLog.pruneOldSignals(ninetyDaysAgo);

    console.log(`Maintenance complete: ${expiredCandidates} candidates, ${expiredEvents} events, ${prunedSignals} signals`);

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
    totalSignals: number;
    activeCandidates: number;
    validatedEvents: number;
    activeCountries: number;
    avgDataQuality: number;
  } {
    const signalStats = escalationSignalLog.getStatistics();
    const candidateStats = eventCandidateStore.getStatistics();
    const csiStats = csiEngine.getStatistics();

    return {
      initialized: this.initialized,
      totalSignals: signalStats.totalSignals,
      activeCandidates: candidateStats.pendingCount,
      validatedEvents: candidateStats.validatedCount,
      activeCountries: csiStats.totalCountries,
      avgDataQuality: csiStats.avgDataQuality
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
      csi: csiEngine.getStatistics(),
      sources: sourceRegistry.getStatistics()
    };
  }
}

// Singleton instance
export const csiEngineOrchestrator = new CSIEngineOrchestrator();