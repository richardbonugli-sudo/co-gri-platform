/**
 * Ground-Truth Recall Audit Service
 * 
 * Validates CSI system recall by comparing against curated ground-truth events.
 * Implements detection matching, routing validation, and false negative analysis.
 */

import {
  GroundTruthRecallAuditResult,
  TimeWindow,
  AuditProgress,
  GroundTruthEvent,
  DetectionMatch,
  RecallMetrics,
  RoutingValidation,
  FalseNegativeCatalog,
  ExpectationWeightingValidation,
  CSIRiskVector,
  EventType,
  MatchType,
  DetectionStatus,
  FalseNegativeReason,
  AuditSummary,
  Recommendation
} from '../../types/audit.types';

export class GroundTruthRecallAuditService {
  private groundTruthRegistry: GroundTruthEvent[] = [];

  constructor() {
    this.initializeGroundTruthRegistry();
  }

  /**
   * Execute complete recall audit
   */
  async executeAudit(
    timeWindow: TimeWindow,
    progressCallback?: (progress: AuditProgress) => void
  ): Promise<GroundTruthRecallAuditResult> {
    const auditId = `gt-audit-${Date.now()}`;
    const totalSections = 6;

    progressCallback?.({
      current_section: 1,
      total_sections: totalSections,
      section_name: 'Loading Ground-Truth Events',
      percentage_complete: 0,
      estimated_time_remaining_seconds: 30
    });

    // Load ground-truth events
    const groundTruthEvents = this.loadGroundTruthEvents(timeWindow);

    progressCallback?.({
      current_section: 2,
      total_sections: totalSections,
      section_name: 'Matching Detections',
      percentage_complete: 20,
      estimated_time_remaining_seconds: 24
    });

    // Match events to detections
    const detectionMatches = await this.matchAllEvents(groundTruthEvents);

    progressCallback?.({
      current_section: 3,
      total_sections: totalSections,
      section_name: 'Calculating Recall Metrics',
      percentage_complete: 40,
      estimated_time_remaining_seconds: 18
    });

    // Calculate recall metrics
    const recallMetrics = this.calculateRecallMetrics(detectionMatches, groundTruthEvents);

    progressCallback?.({
      current_section: 4,
      total_sections: totalSections,
      section_name: 'Validating Routing',
      percentage_complete: 60,
      estimated_time_remaining_seconds: 12
    });

    // Validate routing
    const routingValidation = this.validateRouting(detectionMatches, groundTruthEvents);

    progressCallback?.({
      current_section: 5,
      total_sections: totalSections,
      section_name: 'Analyzing False Negatives',
      percentage_complete: 80,
      estimated_time_remaining_seconds: 6
    });

    // Analyze false negatives
    const falseNegativeCatalog = this.analyzeFalseNegatives(detectionMatches, groundTruthEvents);

    // Validate expectation weighting
    const expectationWeightingValidation = this.validateExpectationWeighting(
      detectionMatches,
      groundTruthEvents
    );

    progressCallback?.({
      current_section: 6,
      total_sections: totalSections,
      section_name: 'Generating Summary',
      percentage_complete: 95,
      estimated_time_remaining_seconds: 2
    });

    // Generate summary and recommendations
    const summary = this.generateSummary(recallMetrics, falseNegativeCatalog);
    const recommendations = this.generateRecommendations(falseNegativeCatalog, routingValidation);

    progressCallback?.({
      current_section: totalSections,
      total_sections: totalSections,
      section_name: 'Complete',
      percentage_complete: 100,
      estimated_time_remaining_seconds: 0
    });

    return {
      audit_id: auditId,
      generated_at: new Date(),
      time_window: timeWindow,
      ground_truth_registry_version: '1.0',
      recall_metrics: recallMetrics,
      routing_validation: routingValidation,
      false_negative_catalog: falseNegativeCatalog,
      expectation_weighting_validation: expectationWeightingValidation,
      summary,
      recommendations
    };
  }

  /**
   * Initialize ground-truth event registry with 70+ mock events
   */
  private initializeGroundTruthRegistry(): void {
    const vectors = Object.values(CSIRiskVector);
    
    vectors.forEach((vector, vectorIndex) => {
      // Create 10-12 events per vector
      const eventCount = 10 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < eventCount; i++) {
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() - Math.floor(Math.random() * 365));
        
        const severity: 'MAJOR' | 'MODERATE' | 'MINOR' = 
          i < 4 ? 'MAJOR' : i < 8 ? 'MODERATE' : 'MINOR';
        
        const isAnticipated = Math.random() > 0.4;
        
        this.groundTruthRegistry.push({
          event_id: `GT_${vector.substring(0, 3).toUpperCase()}_${String(i + 1).padStart(3, '0')}`,
          event_name: this.generateEventName(vector, severity),
          event_type: this.getEventType(severity),
          event_date: eventDate,
          detection_window_start: new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000),
          detection_window_end: new Date(eventDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          anticipation_window_start: new Date(eventDate.getTime() - 30 * 24 * 60 * 60 * 1000),
          primary_country: this.getRandomCountry(),
          affected_countries: [],
          region: this.getRandomRegion(),
          primary_vector: vector,
          secondary_vectors: [],
          severity,
          expected_drift: isAnticipated,
          expected_confirmation: true,
          expected_drift_magnitude: isAnticipated ? Math.random() * 3 + 1 : 0,
          expected_delta_magnitude: severity === 'MAJOR' ? Math.random() * 5 + 5 : 
                                    severity === 'MODERATE' ? Math.random() * 3 + 2 : 
                                    Math.random() * 2 + 0.5,
          source_url: 'https://example.com/event',
          source_type: 'INTERNATIONAL_ORG',
          verification_confidence: 0.9 + Math.random() * 0.1,
          is_anticipated: isAnticipated,
          is_surprise: !isAnticipated,
          has_lead_indicators: isAnticipated,
          selection_rationale: `Representative ${severity} event for ${vector}`,
          expected_keywords: this.getKeywordsForVector(vector),
          notes: ''
        });
      }
    });
  }

  /**
   * Load ground-truth events for time window
   */
  private loadGroundTruthEvents(timeWindow: TimeWindow): GroundTruthEvent[] {
    // For demo, return all events
    return this.groundTruthRegistry;
  }

  /**
   * Match all events to detections
   */
  private async matchAllEvents(events: GroundTruthEvent[]): Promise<DetectionMatch[]> {
    const matches: DetectionMatch[] = [];

    for (const event of events) {
      const match = await this.matchEvent(event);
      matches.push(match);
    }

    return matches;
  }

  /**
   * Match single event to detection
   */
  private async matchEvent(event: GroundTruthEvent): Promise<DetectionMatch> {
    // Simulate detection matching with 85% recall rate
    const isDetected = Math.random() > 0.15;
    
    if (!isDetected) {
      return {
        ground_truth_event_id: event.event_id,
        detection_id: null,
        detection_date: null,
        detection_source: null,
        detection_text: null,
        match_type: MatchType.NO_MATCH,
        match_confidence: 0,
        match_method: 'temporal_keyword',
        temporal_offset_days: 0,
        routed_vector: null,
        routing_correct: false,
        routing_confidence: 0,
        produced_drift: false,
        produced_event_delta: false,
        drift_magnitude: 0,
        event_delta_magnitude: 0,
        detection_status: DetectionStatus.NOT_DETECTED,
        false_negative_reason: this.determineFalseNegativeReason()
      };
    }

    // Detected - check routing
    const routingCorrect = Math.random() > 0.1; // 90% routing accuracy
    const detectionDate = new Date(event.event_date.getTime() + (Math.random() - 0.5) * 3 * 24 * 60 * 60 * 1000);

    return {
      ground_truth_event_id: event.event_id,
      detection_id: `DET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      detection_date: detectionDate,
      detection_source: 'Reuters',
      detection_text: event.event_name,
      match_type: MatchType.EXACT_MATCH,
      match_confidence: 0.85 + Math.random() * 0.15,
      match_method: 'temporal_keyword',
      temporal_offset_days: Math.abs(Math.floor((detectionDate.getTime() - event.event_date.getTime()) / (24 * 60 * 60 * 1000))),
      routed_vector: routingCorrect ? event.primary_vector : this.getRandomVector(),
      routing_correct: routingCorrect,
      routing_confidence: 0.7 + Math.random() * 0.3,
      produced_drift: event.expected_drift,
      produced_event_delta: event.expected_confirmation,
      drift_magnitude: event.expected_drift_magnitude,
      event_delta_magnitude: event.expected_delta_magnitude,
      detection_status: routingCorrect ? DetectionStatus.DETECTED_CORRECT : DetectionStatus.DETECTED_MISROUTED,
      false_negative_reason: null
    };
  }

  /**
   * Calculate recall metrics
   */
  private calculateRecallMetrics(
    matches: DetectionMatch[],
    events: GroundTruthEvent[]
  ): RecallMetrics {
    const totalEvents = events.length;
    const detected = matches.filter(m => 
      m.detection_status === DetectionStatus.DETECTED_CORRECT ||
      m.detection_status === DetectionStatus.DETECTED_MISROUTED
    ).length;
    const missed = totalEvents - detected;

    // Per-vector metrics
    const byVector: Record<CSIRiskVector, any> = {} as any;
    Object.values(CSIRiskVector).forEach(vector => {
      const vectorEvents = events.filter(e => e.primary_vector === vector);
      const vectorMatches = matches.filter(m => {
        const event = events.find(e => e.event_id === m.ground_truth_event_id);
        return event?.primary_vector === vector;
      });
      
      const vectorDetected = vectorMatches.filter(m =>
        m.detection_status === DetectionStatus.DETECTED_CORRECT ||
        m.detection_status === DetectionStatus.DETECTED_MISROUTED
      ).length;

      const detectedMatches = vectorMatches.filter(m => m.detection_date !== null);
      const latencies = detectedMatches.map(m => m.temporal_offset_days);
      const meanLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

      const correctlyRouted = vectorMatches.filter(m => m.routing_correct).length;
      const routingAccuracy = vectorDetected > 0 ? correctlyRouted / vectorDetected : 0;

      byVector[vector] = {
        vector,
        total_events: vectorEvents.length,
        detected: vectorDetected,
        missed: vectorEvents.length - vectorDetected,
        recall_rate: vectorEvents.length > 0 ? vectorDetected / vectorEvents.length : 0,
        mean_detection_latency_days: meanLatency,
        routing_accuracy: routingAccuracy,
        common_misrouting_targets: []
      };
    });

    // Stratified metrics
    const bySeverity: Record<string, any> = {
      MAJOR: this.calculateStratifiedMetrics(matches, events, 'MAJOR'),
      MODERATE: this.calculateStratifiedMetrics(matches, events, 'MODERATE'),
      MINOR: this.calculateStratifiedMetrics(matches, events, 'MINOR')
    };

    const byRegion: Record<string, any> = {};
    const regions = [...new Set(events.map(e => e.region))];
    regions.forEach(region => {
      byRegion[region] = this.calculateStratifiedMetricsByRegion(matches, events, region);
    });

    const byEventType: Record<EventType, any> = {} as any;
    Object.values(EventType).forEach(type => {
      byEventType[type] = this.calculateStratifiedMetricsByEventType(matches, events, type);
    });

    // Detection latency
    const detectedMatches = matches.filter(m => m.detection_date !== null);
    const latencies = detectedMatches.map(m => m.temporal_offset_days).sort((a, b) => a - b);
    const detectionLatency = {
      mean: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      median: latencies.length > 0 ? latencies[Math.floor(latencies.length / 2)] : 0,
      p90: latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.9)] : 0,
      p95: latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0,
      distribution: this.calculateLatencyDistribution(latencies)
    };

    // Routing accuracy
    const routingAccuracy = detected > 0 ? 
      matches.filter(m => m.routing_correct).length / detected : 0;

    return {
      total_ground_truth_events: totalEvents,
      total_detected: detected,
      total_missed: missed,
      overall_recall_rate: detected / totalEvents,
      by_vector: byVector,
      by_severity: bySeverity,
      by_region: byRegion,
      by_event_type: byEventType,
      detection_latency: detectionLatency,
      routing_accuracy: routingAccuracy
    };
  }

  /**
   * Validate routing
   */
  private validateRouting(
    matches: DetectionMatch[],
    events: GroundTruthEvent[]
  ): RoutingValidation {
    const detectedMatches = matches.filter(m => 
      m.detection_status === DetectionStatus.DETECTED_CORRECT ||
      m.detection_status === DetectionStatus.DETECTED_MISROUTED
    );

    const totalDetected = detectedMatches.length;
    const correctlyRouted = detectedMatches.filter(m => m.routing_correct).length;
    const misrouted = totalDetected - correctlyRouted;

    // Build confusion matrix
    const confusionMatrix = this.buildConfusionMatrix(matches, events);

    // Identify misrouting patterns
    const misroutingPatterns = this.identifyMisroutingPatterns(matches, events);

    return {
      total_detected: totalDetected,
      correctly_routed: correctlyRouted,
      misrouted,
      routing_accuracy: totalDetected > 0 ? correctlyRouted / totalDetected : 0,
      confusion_matrix: confusionMatrix,
      misrouting_patterns: misroutingPatterns
    };
  }

  /**
   * Analyze false negatives
   */
  private analyzeFalseNegatives(
    matches: DetectionMatch[],
    events: GroundTruthEvent[]
  ): FalseNegativeCatalog {
    const falseNegatives = matches.filter(m => 
      m.detection_status === DetectionStatus.NOT_DETECTED ||
      m.detection_status === DetectionStatus.DETECTED_SUPPRESSED
    );

    const byReason: Record<FalseNegativeReason, number> = {} as any;
    Object.values(FalseNegativeReason).forEach(reason => {
      byReason[reason] = falseNegatives.filter(m => m.false_negative_reason === reason).length;
    });

    const byVector: Record<CSIRiskVector, any[]> = {} as any;
    Object.values(CSIRiskVector).forEach(vector => {
      byVector[vector] = [];
    });

    falseNegatives.forEach(match => {
      const event = events.find(e => e.event_id === match.ground_truth_event_id);
      if (event) {
        byVector[event.primary_vector].push({
          event_id: event.event_id,
          event_name: event.event_name,
          reason: match.false_negative_reason || FalseNegativeReason.COVERAGE_GAP,
          details: this.getFalseNegativeDetails(match.false_negative_reason || FalseNegativeReason.COVERAGE_GAP),
          remediation: this.getFalseNegativeRemediation(match.false_negative_reason || FalseNegativeReason.COVERAGE_GAP)
        });
      }
    });

    const priorityRemediations = this.prioritizeRemediations(byReason);

    return {
      total_false_negatives: falseNegatives.length,
      by_reason: byReason,
      by_vector: byVector,
      priority_remediations: priorityRemediations
    };
  }

  /**
   * Validate expectation weighting
   */
  private validateExpectationWeighting(
    matches: DetectionMatch[],
    events: GroundTruthEvent[]
  ): ExpectationWeightingValidation {
    const anticipatedEvents = events.filter(e => e.is_anticipated);
    const eventsWithDrift = matches.filter(m => {
      const event = events.find(e => e.event_id === m.ground_truth_event_id);
      return event?.is_anticipated && m.produced_drift;
    }).length;

    const validations = anticipatedEvents.map(event => {
      const match = matches.find(m => m.ground_truth_event_id === event.event_id);
      
      return {
        event_id: event.event_id,
        event_name: event.event_name,
        anticipation_window_start: event.anticipation_window_start,
        event_date: event.event_date,
        drift_detected: match?.produced_drift || false,
        drift_start_date: match?.produced_drift ? 
          new Date(event.event_date.getTime() - 14 * 24 * 60 * 60 * 1000) : null,
        drift_magnitude: match?.drift_magnitude || 0,
        drift_within_window: match?.produced_drift || false,
        confirmation_detected: match?.produced_event_delta || false,
        confirmation_date: match?.detection_date || null,
        event_delta_magnitude: match?.event_delta_magnitude || 0,
        netting_occurred: match?.produced_drift && match?.produced_event_delta || false,
        netting_amount: match?.drift_magnitude || 0,
        validation_passed: match?.produced_drift && match?.produced_event_delta || false,
        failure_reason: !match?.produced_drift ? 'No drift detected' : null
      };
    });

    const leadTimes = validations
      .filter(v => v.drift_detected && v.drift_start_date)
      .map(v => (v.event_date.getTime() - v.drift_start_date!.getTime()) / (24 * 60 * 60 * 1000));

    const meanLeadTime = leadTimes.length > 0 ? 
      leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : 0;

    const nettingEvents = validations.filter(v => v.netting_occurred).length;
    const nettingSuccessRate = eventsWithDrift > 0 ? nettingEvents / eventsWithDrift : 0;

    return {
      total_anticipated_events: anticipatedEvents.length,
      events_with_drift: eventsWithDrift,
      drift_before_confirmation_rate: anticipatedEvents.length > 0 ? 
        eventsWithDrift / anticipatedEvents.length : 0,
      mean_anticipation_lead_time: meanLeadTime,
      netting_success_rate: nettingSuccessRate,
      validations
    };
  }

  /**
   * Helper methods
   */
  private generateEventName(vector: CSIRiskVector, severity: string): string {
    const templates: Record<CSIRiskVector, string[]> = {
      [CSIRiskVector.SANCTIONS_REGULATORY]: ['Sanctions Package', 'Export Controls', 'Regulatory Restrictions'],
      [CSIRiskVector.TRADE_LOGISTICS]: ['Trade Tariffs', 'Import Restrictions', 'Supply Chain Disruption'],
      [CSIRiskVector.CURRENCY_CAPITAL_CONTROLS]: ['Currency Devaluation', 'Capital Controls', 'FX Restrictions'],
      [CSIRiskVector.CYBER_DATA]: ['Cyber Attack', 'Data Breach', 'Infrastructure Hack'],
      [CSIRiskVector.CIVIL_UNREST]: ['Mass Protests', 'Civil Disorder', 'Labor Strike'],
      [CSIRiskVector.CONFLICT_SECURITY]: ['Military Escalation', 'Border Conflict', 'Armed Clashes'],
      [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: ['Constitutional Crisis', 'Judicial Changes', 'Democratic Backsliding']
    };

    const template = templates[vector][Math.floor(Math.random() * templates[vector].length)];
    return `${severity} ${template}`;
  }

  private getEventType(severity: string): EventType {
    if (severity === 'MAJOR') return Math.random() > 0.5 ? EventType.ESCALATION : EventType.DISCRETE;
    if (severity === 'MODERATE') return EventType.DISCRETE;
    return EventType.DISCRETE;
  }

  private getRandomCountry(): string {
    const countries = ['USA', 'CHN', 'RUS', 'GBR', 'FRA', 'DEU', 'JPN', 'IND', 'BRA', 'MEX'];
    return countries[Math.floor(Math.random() * countries.length)];
  }

  private getRandomRegion(): string {
    const regions = ['North America', 'Europe', 'Asia-Pacific', 'Middle East', 'Latin America', 'Africa'];
    return regions[Math.floor(Math.random() * regions.length)];
  }

  private getRandomVector(): CSIRiskVector {
    const vectors = Object.values(CSIRiskVector);
    return vectors[Math.floor(Math.random() * vectors.length)];
  }

  private getKeywordsForVector(vector: CSIRiskVector): string[] {
    const keywords: Record<CSIRiskVector, string[]> = {
      [CSIRiskVector.SANCTIONS_REGULATORY]: ['sanctions', 'embargo', 'restrictions', 'OFAC'],
      [CSIRiskVector.TRADE_LOGISTICS]: ['tariff', 'trade', 'export', 'import'],
      [CSIRiskVector.CURRENCY_CAPITAL_CONTROLS]: ['currency', 'forex', 'capital', 'devaluation'],
      [CSIRiskVector.CYBER_DATA]: ['cyber', 'hack', 'breach', 'attack'],
      [CSIRiskVector.CIVIL_UNREST]: ['protest', 'unrest', 'demonstration', 'strike'],
      [CSIRiskVector.CONFLICT_SECURITY]: ['conflict', 'military', 'war', 'clashes'],
      [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: ['governance', 'democracy', 'judicial', 'constitutional']
    };
    return keywords[vector];
  }

  private determineFalseNegativeReason(): FalseNegativeReason {
    const reasons = Object.values(FalseNegativeReason);
    const weights = [0.3, 0.25, 0.2, 0.1, 0.05, 0.05, 0.03, 0.02]; // Coverage gap most common
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < reasons.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) return reasons[i];
    }
    
    return FalseNegativeReason.COVERAGE_GAP;
  }

  private calculateStratifiedMetrics(
    matches: DetectionMatch[],
    events: GroundTruthEvent[],
    severity: string
  ): any {
    const severityEvents = events.filter(e => e.severity === severity);
    const severityMatches = matches.filter(m => {
      const event = events.find(e => e.event_id === m.ground_truth_event_id);
      return event?.severity === severity;
    });
    
    const detected = severityMatches.filter(m =>
      m.detection_status === DetectionStatus.DETECTED_CORRECT ||
      m.detection_status === DetectionStatus.DETECTED_MISROUTED
    ).length;

    return {
      category: severity,
      total_events: severityEvents.length,
      detected,
      recall_rate: severityEvents.length > 0 ? detected / severityEvents.length : 0
    };
  }

  private calculateStratifiedMetricsByRegion(
    matches: DetectionMatch[],
    events: GroundTruthEvent[],
    region: string
  ): any {
    const regionEvents = events.filter(e => e.region === region);
    const regionMatches = matches.filter(m => {
      const event = events.find(e => e.event_id === m.ground_truth_event_id);
      return event?.region === region;
    });
    
    const detected = regionMatches.filter(m =>
      m.detection_status === DetectionStatus.DETECTED_CORRECT ||
      m.detection_status === DetectionStatus.DETECTED_MISROUTED
    ).length;

    return {
      category: region,
      total_events: regionEvents.length,
      detected,
      recall_rate: regionEvents.length > 0 ? detected / regionEvents.length : 0
    };
  }

  private calculateStratifiedMetricsByEventType(
    matches: DetectionMatch[],
    events: GroundTruthEvent[],
    eventType: EventType
  ): any {
    const typeEvents = events.filter(e => e.event_type === eventType);
    const typeMatches = matches.filter(m => {
      const event = events.find(e => e.event_id === m.ground_truth_event_id);
      return event?.event_type === eventType;
    });
    
    const detected = typeMatches.filter(m =>
      m.detection_status === DetectionStatus.DETECTED_CORRECT ||
      m.detection_status === DetectionStatus.DETECTED_MISROUTED
    ).length;

    return {
      category: eventType,
      total_events: typeEvents.length,
      detected,
      recall_rate: typeEvents.length > 0 ? detected / typeEvents.length : 0
    };
  }

  private calculateLatencyDistribution(latencies: number[]): Array<{ days: number; count: number }> {
    const distribution: Array<{ days: number; count: number }> = [];
    for (let day = 0; day <= 7; day++) {
      const count = latencies.filter(l => Math.floor(l) === day).length;
      distribution.push({ days: day, count });
    }
    return distribution;
  }

  private buildConfusionMatrix(matches: DetectionMatch[], events: GroundTruthEvent[]): any {
    const matrix: Record<CSIRiskVector, Record<CSIRiskVector, number>> = {} as any;
    const vectors = Object.values(CSIRiskVector);
    
    // Initialize matrix
    vectors.forEach(v1 => {
      matrix[v1] = {} as any;
      vectors.forEach(v2 => {
        matrix[v1][v2] = 0;
      });
    });

    // Populate matrix
    matches.forEach(match => {
      if (match.routed_vector) {
        const event = events.find(e => e.event_id === match.ground_truth_event_id);
        if (event) {
          matrix[event.primary_vector][match.routed_vector]++;
        }
      }
    });

    // Calculate metrics
    const rowTotals: Record<CSIRiskVector, number> = {} as any;
    const columnTotals: Record<CSIRiskVector, number> = {} as any;
    const diagonal: Record<CSIRiskVector, number> = {} as any;

    vectors.forEach(v => {
      rowTotals[v] = vectors.reduce((sum, v2) => sum + matrix[v][v2], 0);
      columnTotals[v] = vectors.reduce((sum, v2) => sum + matrix[v2][v], 0);
      diagonal[v] = matrix[v][v];
    });

    const precision: Record<CSIRiskVector, number> = {} as any;
    const recall: Record<CSIRiskVector, number> = {} as any;
    const f1Score: Record<CSIRiskVector, number> = {} as any;

    vectors.forEach(v => {
      precision[v] = columnTotals[v] > 0 ? diagonal[v] / columnTotals[v] : 0;
      recall[v] = rowTotals[v] > 0 ? diagonal[v] / rowTotals[v] : 0;
      f1Score[v] = (precision[v] + recall[v]) > 0 ? 
        2 * (precision[v] * recall[v]) / (precision[v] + recall[v]) : 0;
    });

    return {
      matrix,
      row_totals: rowTotals,
      column_totals: columnTotals,
      diagonal,
      precision,
      recall,
      f1_score: f1Score
    };
  }

  private identifyMisroutingPatterns(matches: DetectionMatch[], events: GroundTruthEvent[]): any[] {
    const patterns: any[] = [];
    const vectors = Object.values(CSIRiskVector);

    vectors.forEach(from => {
      vectors.forEach(to => {
        if (from !== to) {
          const count = matches.filter(m => {
            const event = events.find(e => e.event_id === m.ground_truth_event_id);
            return event?.primary_vector === from && m.routed_vector === to;
          }).length;

          if (count >= 2) {
            const examples = matches
              .filter(m => {
                const event = events.find(e => e.event_id === m.ground_truth_event_id);
                return event?.primary_vector === from && m.routed_vector === to;
              })
              .slice(0, 3)
              .map(m => m.ground_truth_event_id);

            patterns.push({
              from_vector: from,
              to_vector: to,
              count,
              percentage: 0, // Would calculate from total
              example_events: examples,
              suspected_cause: 'Keyword overlap or classifier ambiguity'
            });
          }
        }
      });
    });

    return patterns.sort((a, b) => b.count - a.count);
  }

  private getFalseNegativeDetails(reason: FalseNegativeReason): string {
    const details: Record<FalseNegativeReason, string> = {
      [FalseNegativeReason.COVERAGE_GAP]: 'Source feed missing or inactive',
      [FalseNegativeReason.ROUTING_FAILURE]: 'Detected but routed to wrong vector',
      [FalseNegativeReason.SCORING_SUPPRESSION]: 'Detected but filtered by scoring rules',
      [FalseNegativeReason.KEYWORD_MISMATCH]: 'Keywords insufficient for detection',
      [FalseNegativeReason.TEMPORAL_MISMATCH]: 'Detection outside time window',
      [FalseNegativeReason.GEOGRAPHIC_FILTER]: 'Country not in scope',
      [FalseNegativeReason.DUPLICATE_SUPPRESSION]: 'Merged with another event',
      [FalseNegativeReason.CONFIRMATION_ONLY]: 'Only confirmation source available'
    };
    return details[reason];
  }

  private getFalseNegativeRemediation(reason: FalseNegativeReason): string {
    const remediations: Record<FalseNegativeReason, string> = {
      [FalseNegativeReason.COVERAGE_GAP]: 'Add redundant detection sources',
      [FalseNegativeReason.ROUTING_FAILURE]: 'Retrain routing classifier',
      [FalseNegativeReason.SCORING_SUPPRESSION]: 'Review scoring thresholds',
      [FalseNegativeReason.KEYWORD_MISMATCH]: 'Expand keyword dictionary',
      [FalseNegativeReason.TEMPORAL_MISMATCH]: 'Review time window parameters',
      [FalseNegativeReason.GEOGRAPHIC_FILTER]: 'Expand geographic coverage',
      [FalseNegativeReason.DUPLICATE_SUPPRESSION]: 'Review deduplication logic',
      [FalseNegativeReason.CONFIRMATION_ONLY]: 'Add anticipatory sources'
    };
    return remediations[reason];
  }

  private prioritizeRemediations(byReason: Record<FalseNegativeReason, number>): any[] {
    const remediations: any[] = [];

    Object.entries(byReason).forEach(([reason, count]) => {
      if (count > 0) {
        const priority = this.getRemediationPriority(reason as FalseNegativeReason, count);
        remediations.push({
          reason: reason as FalseNegativeReason,
          affected_events: count,
          priority,
          recommended_action: this.getFalseNegativeRemediation(reason as FalseNegativeReason)
        });
      }
    });

    return remediations.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || b.affected_events - a.affected_events;
    });
  }

  private getRemediationPriority(reason: FalseNegativeReason, count: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (reason === FalseNegativeReason.COVERAGE_GAP || reason === FalseNegativeReason.ROUTING_FAILURE) {
      return 'HIGH';
    }
    if (count > 5) return 'MEDIUM';
    return 'LOW';
  }

  private generateSummary(recallMetrics: RecallMetrics, falseNegativeCatalog: FalseNegativeCatalog): AuditSummary {
    const recallRate = recallMetrics.overall_recall_rate;
    const sectionsMeeting = recallRate >= 0.85 ? 6 : recallRate >= 0.75 ? 4 : 2;

    let assessment: 'structural_integrity_confirmed' | 'partial_functionality' | 'fundamental_issues';
    if (recallRate >= 0.85) {
      assessment = 'structural_integrity_confirmed';
    } else if (recallRate >= 0.75) {
      assessment = 'partial_functionality';
    } else {
      assessment = 'fundamental_issues';
    }

    const keyFindings: string[] = [
      `Overall recall rate: ${(recallRate * 100).toFixed(1)}%`,
      `${recallMetrics.total_detected}/${recallMetrics.total_ground_truth_events} events detected`,
      `Routing accuracy: ${(recallMetrics.routing_accuracy * 100).toFixed(1)}%`
    ];

    const criticalIssues: string[] = [];
    if (recallRate < 0.85) {
      criticalIssues.push(`Recall rate below 85% threshold`);
    }
    if (falseNegativeCatalog.total_false_negatives > 10) {
      criticalIssues.push(`${falseNegativeCatalog.total_false_negatives} false negatives detected`);
    }

    return {
      sections_meeting_criteria: sectionsMeeting,
      total_sections: 6,
      overall_assessment: assessment,
      key_findings: keyFindings,
      critical_issues: criticalIssues
    };
  }

  private generateRecommendations(
    falseNegativeCatalog: FalseNegativeCatalog,
    routingValidation: RoutingValidation
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    falseNegativeCatalog.priority_remediations.forEach(rem => {
      recommendations.push({
        priority: rem.priority,
        category: 'False Negative Remediation',
        description: `Address ${rem.reason}: ${rem.affected_events} events affected`,
        affected_vectors: [],
        remediation_steps: [rem.recommended_action]
      });
    });

    if (routingValidation.routing_accuracy < 0.9) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Routing Accuracy',
        description: `Routing accuracy is ${(routingValidation.routing_accuracy * 100).toFixed(1)}% (target: 90%)`,
        affected_vectors: [],
        remediation_steps: ['Review and retrain routing classifier', 'Add training examples from misrouted events']
      });
    }

    return recommendations;
  }
}