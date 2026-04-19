/**
 * Confirmation Matcher
 * 
 * Automatically matches authoritative confirmations with provisional events
 * and triggers state transitions from PROVISIONAL to CONFIRMED.
 * 
 * Core logic:
 * 1. Match confirmations with provisional events based on similarity
 * 2. Trigger state transitions when confidence threshold met
 * 3. Net baseline drift and calculate Event_CSI_Δ
 * 4. Update CSI ledgers and audit trails
 * 
 * @module ingestion/authoritative/confirmationMatcher
 */

import { EventCandidate, EventState, TransitionTrigger } from '../../lifecycle/eventStateMachine';
import { RiskVector } from '../../routing/vectorRouter';

export interface ConfirmationEvent {
  sourceId: string;
  sourceType: 'authoritative';
  vector: RiskVector;
  title: string;
  description: string;
  url: string;
  publishedAt: Date;
  credibility: number;
  countries: string[];
  eventType: string;
  metadata?: Record<string, any>;
}

export interface MatchResult {
  eventId: string;
  confirmationId: string;
  confidence: number;
  matchReasons: string[];
  event: EventCandidate;
  confirmation: ConfirmationEvent;
}

export interface CSIDeltaCalculation {
  eventId: string;
  country: string;
  vector: RiskVector;
  severity: number;
  priorDrift: number;
  grossImpact: number;
  netImpact: number;
  decayHalfLife: number;
}

/**
 * Confirmation Matcher Service
 * 
 * Matches authoritative confirmations with provisional events
 */
export class ConfirmationMatcher {
  private readonly MATCH_THRESHOLD = 0.8;
  private readonly TIME_WINDOW_DAYS = 7;
  
  // Vector-specific CSI impact weights
  private readonly VECTOR_WEIGHTS: Record<RiskVector, number> = {
    [RiskVector.SC1_CONFLICT]: 1.5,      // Highest impact
    [RiskVector.SC2_SANCTIONS]: 1.3,
    [RiskVector.SC3_TRADE]: 1.2,
    [RiskVector.SC4_GOVERNANCE]: 1.1,
    [RiskVector.SC5_CYBER]: 1.0,
    [RiskVector.SC6_UNREST]: 0.9,
    [RiskVector.SC7_CURRENCY]: 1.4
  };

  constructor() {}

  /**
   * Match a confirmation event with provisional events
   * 
   * @param confirmation - Authoritative confirmation event
   * @returns Array of match results sorted by confidence
   */
  async matchProvisionalEvents(confirmation: ConfirmationEvent): Promise<MatchResult[]> {
    console.log(`Matching confirmation: ${confirmation.title}`);
    
    // 1. Query provisional events within time window
    const provisionalEvents = await this.queryProvisionalEvents(
      confirmation.countries,
      confirmation.vector,
      confirmation.publishedAt
    );

    if (provisionalEvents.length === 0) {
      console.log('No provisional events found for matching');
      return [];
    }

    console.log(`Found ${provisionalEvents.length} provisional events to match against`);

    // 2. Calculate similarity scores for each event
    const matches: MatchResult[] = [];
    
    for (const event of provisionalEvents) {
      const matchResult = this.calculateMatchScore(event, confirmation);
      
      if (matchResult.confidence >= this.MATCH_THRESHOLD) {
        matches.push(matchResult);
      }
    }

    // 3. Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence);

    console.log(`Found ${matches.length} matches above threshold ${this.MATCH_THRESHOLD}`);
    
    return matches;
  }

  /**
   * Query provisional events for matching
   */
  private async queryProvisionalEvents(
    countries: string[],
    vector: RiskVector,
    publishedAt: Date
  ): Promise<EventCandidate[]> {
    // TODO: Query database for provisional events
    // For now, return mock data
    
    const timeWindowStart = new Date(publishedAt.getTime() - this.TIME_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    
    console.log(`Querying provisional events:`, {
      countries,
      vector,
      timeWindow: `${timeWindowStart.toISOString()} to ${publishedAt.toISOString()}`
    });

    // Mock provisional events
    return [];
  }

  /**
   * Calculate match score between event and confirmation
   */
  private calculateMatchScore(
    event: EventCandidate,
    confirmation: ConfirmationEvent
  ): MatchResult {
    const matchReasons: string[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // 1. Country match (weight: 0.3)
    const countryScore = this.calculateCountryMatch(event, confirmation);
    totalScore += countryScore * 0.3;
    maxScore += 0.3;
    if (countryScore > 0.5) {
      matchReasons.push(`Country match: ${(countryScore * 100).toFixed(0)}%`);
    }

    // 2. Vector match (weight: 0.25)
    const vectorScore = event.primaryVector === confirmation.vector ? 1.0 : 
                       event.secondaryVectors.includes(confirmation.vector) ? 0.5 : 0;
    totalScore += vectorScore * 0.25;
    maxScore += 0.25;
    if (vectorScore > 0) {
      matchReasons.push(`Vector match: ${confirmation.vector}`);
    }

    // 3. Time proximity (weight: 0.2)
    const timeScore = this.calculateTimeProximity(event.detectedAt, confirmation.publishedAt);
    totalScore += timeScore * 0.2;
    maxScore += 0.2;
    if (timeScore > 0.5) {
      matchReasons.push(`Time proximity: ${(timeScore * 100).toFixed(0)}%`);
    }

    // 4. Keyword overlap (weight: 0.15)
    const keywordScore = this.calculateKeywordOverlap(event, confirmation);
    totalScore += keywordScore * 0.15;
    maxScore += 0.15;
    if (keywordScore > 0.3) {
      matchReasons.push(`Keyword overlap: ${(keywordScore * 100).toFixed(0)}%`);
    }

    // 5. Event type match (weight: 0.1)
    const eventTypeScore = this.calculateEventTypeMatch(event, confirmation);
    totalScore += eventTypeScore * 0.1;
    maxScore += 0.1;
    if (eventTypeScore > 0.5) {
      matchReasons.push(`Event type match`);
    }

    const confidence = totalScore / maxScore;

    return {
      eventId: event.id,
      confirmationId: `${confirmation.sourceId}_${Date.now()}`,
      confidence,
      matchReasons,
      event,
      confirmation
    };
  }

  /**
   * Calculate country match score
   */
  private calculateCountryMatch(event: EventCandidate, confirmation: ConfirmationEvent): number {
    // Extract countries from event metadata
    const eventCountries = event.metadata?.countries || [];
    
    // Check for overlap
    const overlap = confirmation.countries.filter(c => 
      eventCountries.includes(c)
    ).length;

    if (overlap === 0) return 0;
    
    return Math.min(1.0, overlap / confirmation.countries.length);
  }

  /**
   * Calculate time proximity score
   */
  private calculateTimeProximity(eventDate: Date, confirmationDate: Date): number {
    const diffMs = Math.abs(confirmationDate.getTime() - eventDate.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Score decreases linearly from 1.0 (same day) to 0 (7+ days)
    return Math.max(0, 1 - (diffDays / this.TIME_WINDOW_DAYS));
  }

  /**
   * Calculate keyword overlap score
   */
  private calculateKeywordOverlap(event: EventCandidate, confirmation: ConfirmationEvent): number {
    const eventText = `${event.title} ${event.description}`.toLowerCase();
    const confirmationText = `${confirmation.title} ${confirmation.description}`.toLowerCase();

    // Extract significant words (>3 characters)
    const eventWords = new Set(
      eventText.split(/\s+/).filter(w => w.length > 3)
    );
    const confirmationWords = new Set(
      confirmationText.split(/\s+/).filter(w => w.length > 3)
    );

    // Calculate Jaccard similarity
    const intersection = new Set(
      [...eventWords].filter(w => confirmationWords.has(w))
    );
    const union = new Set([...eventWords, ...confirmationWords]);

    return intersection.size / union.size;
  }

  /**
   * Calculate event type match score
   */
  private calculateEventTypeMatch(event: EventCandidate, confirmation: ConfirmationEvent): number {
    const eventType = event.metadata?.eventType || '';
    const confirmationType = confirmation.eventType;

    if (eventType === confirmationType) return 1.0;
    
    // Check for semantic similarity (simplified)
    const eventTokens = eventType.toLowerCase().split('_');
    const confirmationTokens = confirmationType.toLowerCase().split('_');
    
    const overlap = eventTokens.filter(t => confirmationTokens.includes(t)).length;
    
    return overlap / Math.max(eventTokens.length, confirmationTokens.length);
  }

  /**
   * Trigger state transition from PROVISIONAL to CONFIRMED
   * 
   * @param eventId - Event ID to confirm
   * @param confirmationSource - Source ID of confirmation
   */
  async confirmEvent(eventId: string, confirmationSource: string): Promise<void> {
    console.log(`Confirming event ${eventId} with source ${confirmationSource}`);

    try {
      // 1. Load event from database
      const event = await this.loadEvent(eventId);
      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }

      // 2. Validate current state
      if (event.state !== EventState.PROVISIONAL) {
        console.warn(`Event ${eventId} is not in PROVISIONAL state (current: ${event.state})`);
        return;
      }

      // 3. Calculate Event_CSI_Δ
      const csiDelta = await this.calculateEventCSIDelta(event);

      // 4. Update event state
      // TODO: Use event state machine to transition
      console.log(`Event ${eventId} confirmed with CSI delta:`, csiDelta);

      // 5. Update CSI ledgers
      await this.updateCSILedgers(csiDelta);

      // 6. Create audit trail
      await this.createAuditEntry(event, confirmationSource, csiDelta);

      console.log(`Event ${eventId} successfully confirmed`);

    } catch (error) {
      console.error(`Failed to confirm event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Load event from database
   */
  private async loadEvent(eventId: string): Promise<EventCandidate | null> {
    // TODO: Query database
    console.log(`Loading event ${eventId} from database`);
    return null;
  }

  /**
   * Calculate Event_CSI_Δ (confirmed event shock)
   * 
   * Formula: Event_CSI_Δ = (Severity × Vector_Weight × Country_Exposure) - Prior_Drift
   */
  async calculateEventCSIDelta(event: EventCandidate): Promise<CSIDeltaCalculation> {
    const country = event.metadata?.targetCountry || 'UNKNOWN';
    const vector = event.primaryVector as RiskVector;
    const severity = event.metadata?.severity || 5;

    // Get vector weight
    const vectorWeight = this.VECTOR_WEIGHTS[vector] || 1.0;

    // Get country exposure (simplified - in production, use actual exposure data)
    const countryExposure = 1.0;

    // Calculate gross impact
    const grossImpact = severity * vectorWeight * countryExposure;

    // Get prior drift (if any)
    const priorDrift = event.metadata?.baselineDrift || 0;

    // Calculate net impact
    const netImpact = grossImpact - priorDrift;

    // Determine decay half-life based on vector and severity
    const decayHalfLife = this.calculateDecayHalfLife(vector, severity);

    return {
      eventId: event.id,
      country,
      vector,
      severity,
      priorDrift,
      grossImpact,
      netImpact,
      decayHalfLife
    };
  }

  /**
   * Calculate decay half-life for CSI impact
   */
  private calculateDecayHalfLife(vector: RiskVector, severity: number): number {
    // Base half-life by vector (in days)
    const baseHalfLife: Record<RiskVector, number> = {
      [RiskVector.SC1_CONFLICT]: 180,      // Conflicts decay slowly
      [RiskVector.SC2_SANCTIONS]: 365,     // Sanctions persist long
      [RiskVector.SC3_TRADE]: 90,          // Trade disputes moderate
      [RiskVector.SC4_GOVERNANCE]: 180,    // Political changes slow
      [RiskVector.SC5_CYBER]: 30,          // Cyber incidents quick
      [RiskVector.SC6_UNREST]: 60,         // Unrest moderate
      [RiskVector.SC7_CURRENCY]: 120       // Currency controls moderate
    };

    // Adjust by severity (higher severity = longer decay)
    const severityMultiplier = 0.5 + (severity / 20);
    
    return Math.round(baseHalfLife[vector] * severityMultiplier);
  }

  /**
   * Update CSI ledgers with confirmed event
   */
  private async updateCSILedgers(csiDelta: CSIDeltaCalculation): Promise<void> {
    console.log(`Updating CSI ledgers for ${csiDelta.country}:`, csiDelta);

    // TODO: Insert into event_csi_delta_ledger table
    // TODO: Update csi_time_series table
    // TODO: Recalculate current CSI for country
  }

  /**
   * Create audit trail entry
   */
  private async createAuditEntry(
    event: EventCandidate,
    confirmationSource: string,
    csiDelta: CSIDeltaCalculation
  ): Promise<void> {
    console.log(`Creating audit trail for event ${event.id}`);

    // TODO: Insert into state_transitions_audit table
    const auditEntry = {
      eventId: event.id,
      fromState: EventState.PROVISIONAL,
      toState: EventState.CONFIRMED,
      trigger: TransitionTrigger.CORROBORATION_ACHIEVED,
      actor: 'system',
      reason: `Confirmed by authoritative source: ${confirmationSource}`,
      metadata: {
        confirmationSource,
        csiDelta,
        timestamp: new Date().toISOString()
      }
    };

    console.log('Audit entry:', auditEntry);
  }

  /**
   * Get match threshold
   */
  getMatchThreshold(): number {
    return this.MATCH_THRESHOLD;
  }

  /**
   * Set match threshold
   */
  setMatchThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Match threshold must be between 0 and 1');
    }
    this.MATCH_THRESHOLD = threshold;
  }
}

// Export singleton instance
export const confirmationMatcher = new ConfirmationMatcher();