/**
 * Triage Engine
 * 
 * Applies triage rules to event candidates:
 * - High confidence (>80%) + authoritative source → Auto-confirm
 * - Medium confidence (60-80%) + multiple sources → Manual review
 * - Low confidence (<60%) → Reject
 */

import type { EventCandidate } from './candidateDetector';

export type TriageDecision = 'AUTO_CONFIRM' | 'MANUAL_REVIEW' | 'REJECT';

export interface TriageResult {
  candidate_id: string;
  decision: TriageDecision;
  reasoning: string;
  auto_confirm: boolean;
  requires_review: boolean;
}

// Authoritative sources that boost confidence
const AUTHORITATIVE_SOURCES = [
  'OFAC',
  'BIS',
  'MOFCOM',
  'UN Security Council',
  'EU CFSP',
  'WTO',
  'CISA'
];

/**
 * Triage a single candidate
 */
export function triageCandidate(candidate: EventCandidate): TriageResult {
  const { confidence, source_articles } = candidate;
  
  // Check for authoritative sources
  const hasAuthoritativeSource = source_articles.some(article =>
    AUTHORITATIVE_SOURCES.some(auth => article.source_name.includes(auth))
  );
  
  // Check for multiple sources
  const multipleSourcesCount = source_articles.length;
  
  // Apply triage rules
  let decision: TriageDecision;
  let reasoning: string;
  
  if (confidence >= 80 && hasAuthoritativeSource) {
    decision = 'AUTO_CONFIRM';
    reasoning = `High confidence (${confidence.toFixed(1)}%) with authoritative source. Auto-confirming.`;
  } else if (confidence >= 80 && multipleSourcesCount >= 3) {
    decision = 'AUTO_CONFIRM';
    reasoning = `High confidence (${confidence.toFixed(1)}%) with ${multipleSourcesCount} sources. Auto-confirming.`;
  } else if (confidence >= 60 && multipleSourcesCount >= 2) {
    decision = 'MANUAL_REVIEW';
    reasoning = `Medium confidence (${confidence.toFixed(1)}%) with ${multipleSourcesCount} sources. Requires manual review.`;
  } else if (confidence >= 60) {
    decision = 'MANUAL_REVIEW';
    reasoning = `Medium confidence (${confidence.toFixed(1)}%) with single source. Requires manual review.`;
  } else {
    decision = 'REJECT';
    reasoning = `Low confidence (${confidence.toFixed(1)}%). Rejecting candidate.`;
  }
  
  return {
    candidate_id: candidate.candidate_id,
    decision,
    reasoning,
    auto_confirm: decision === 'AUTO_CONFIRM',
    requires_review: decision === 'MANUAL_REVIEW'
  };
}

/**
 * Triage multiple candidates
 */
export function triageCandidates(candidates: EventCandidate[]): Map<string, TriageResult> {
  const results = new Map<string, TriageResult>();
  
  candidates.forEach(candidate => {
    const result = triageCandidate(candidate);
    results.set(candidate.candidate_id, result);
  });
  
  const autoConfirm = Array.from(results.values()).filter(r => r.auto_confirm).length;
  const manualReview = Array.from(results.values()).filter(r => r.requires_review).length;
  const rejected = Array.from(results.values()).filter(r => r.decision === 'REJECT').length;
  
  console.log(`[Triage Engine] 📋 Triage complete: ${autoConfirm} auto-confirm, ${manualReview} manual review, ${rejected} rejected`);
  
  return results;
}

/**
 * Get candidates for auto-confirmation
 */
export function getAutoConfirmCandidates(
  candidates: EventCandidate[],
  triageResults: Map<string, TriageResult>
): EventCandidate[] {
  return candidates.filter(candidate => {
    const result = triageResults.get(candidate.candidate_id);
    return result?.auto_confirm;
  });
}

/**
 * Get candidates requiring manual review
 */
export function getManualReviewCandidates(
  candidates: EventCandidate[],
  triageResults: Map<string, TriageResult>
): EventCandidate[] {
  return candidates.filter(candidate => {
    const result = triageResults.get(candidate.candidate_id);
    return result?.requires_review;
  });
}

/**
 * Get rejected candidates
 */
export function getRejectedCandidates(
  candidates: EventCandidate[],
  triageResults: Map<string, TriageResult>
): EventCandidate[] {
  return candidates.filter(candidate => {
    const result = triageResults.get(candidate.candidate_id);
    return result?.decision === 'REJECT';
  });
}

/**
 * Override triage decision (for manual intervention)
 */
export function overrideTriageDecision(
  candidateId: string,
  newDecision: TriageDecision,
  reason: string
): TriageResult {
  return {
    candidate_id: candidateId,
    decision: newDecision,
    reasoning: `Manual override: ${reason}`,
    auto_confirm: newDecision === 'AUTO_CONFIRM',
    requires_review: newDecision === 'MANUAL_REVIEW'
  };
}