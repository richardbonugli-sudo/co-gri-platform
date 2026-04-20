/**
 * Persistence Tracker
 * Tracks signal persistence over time
 */

import type { StructuredSignal, PersistenceResult } from '@/types/csi-enhancement/signals';

export interface PersistenceRule {
  minPersistenceHours: number;
  maxGapHours: number;
  minMentionsPerDay: number;
  decayRatePerDay: number;
}

export class PersistenceTracker {
  private defaultRule: PersistenceRule = {
    minPersistenceHours: 48,
    maxGapHours: 24,
    minMentionsPerDay: 2,
    decayRatePerDay: 0.1
  };

  /**
   * Check if signal is persistent
   */
  async checkPersistence(
    signal: StructuredSignal,
    relatedSignals: StructuredSignal[],
    rule: PersistenceRule = this.defaultRule
  ): Promise<PersistenceResult> {
    // Sort signals by time
    const allSignals = [signal, ...relatedSignals].sort((a, b) => 
      a.detectedAt.getTime() - b.detectedAt.getTime()
    );
    
    // Calculate duration
    const firstMention = allSignals[0].detectedAt;
    const lastMention = allSignals[allSignals.length - 1].detectedAt;
    const durationHours = (lastMention.getTime() - firstMention.getTime()) / (1000 * 60 * 60);
    
    // Calculate mention count
    const mentionCount = allSignals.length;
    
    // Calculate mentions per day
    const durationDays = Math.max(durationHours / 24, 0.1);
    const averageMentionsPerDay = mentionCount / durationDays;
    
    // Check for gaps
    const hasLargeGap = this.checkForLargeGaps(allSignals, rule.maxGapHours);
    
    // Calculate persistence score
    const persistenceScore = this.calculatePersistenceScore(
      durationHours,
      mentionCount,
      averageMentionsPerDay,
      hasLargeGap,
      rule
    );
    
    // Determine if persistent
    const isPersistent = 
      durationHours >= rule.minPersistenceHours &&
      !hasLargeGap &&
      averageMentionsPerDay >= rule.minMentionsPerDay &&
      persistenceScore >= 0.6;
    
    return {
      isPersistent,
      durationHours,
      mentionCount,
      averageMentionsPerDay,
      lastMention,
      persistenceScore
    };
  }

  /**
   * Check for large gaps in mentions
   */
  private checkForLargeGaps(
    signals: StructuredSignal[],
    maxGapHours: number
  ): boolean {
    for (let i = 1; i < signals.length; i++) {
      const gap = (signals[i].detectedAt.getTime() - signals[i - 1].detectedAt.getTime()) / (1000 * 60 * 60);
      if (gap > maxGapHours) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculate persistence score
   */
  private calculatePersistenceScore(
    durationHours: number,
    mentionCount: number,
    averageMentionsPerDay: number,
    hasLargeGap: boolean,
    rule: PersistenceRule
  ): number {
    let score = 0;
    
    // Duration component (0-0.4)
    const durationScore = Math.min(durationHours / rule.minPersistenceHours, 2) * 0.4;
    score += durationScore;
    
    // Frequency component (0-0.4)
    const frequencyScore = Math.min(averageMentionsPerDay / rule.minMentionsPerDay, 2) * 0.4;
    score += frequencyScore;
    
    // Consistency component (0-0.2)
    const consistencyScore = hasLargeGap ? 0 : 0.2;
    score += consistencyScore;
    
    return Math.min(score, 1.0);
  }

  /**
   * Find related signals for persistence tracking
   */
  findRelatedSignals(
    signal: StructuredSignal,
    allSignals: StructuredSignal[]
  ): StructuredSignal[] {
    return allSignals.filter(existing => {
      // Don't include the signal itself
      if (existing.signalId === signal.signalId) {
        return false;
      }
      
      // Must have common country
      const hasCommonCountry = signal.countries.some(c => 
        existing.countries.includes(c)
      );
      if (!hasCommonCountry) {
        return false;
      }
      
      // Must have same primary vector
      if (existing.primaryVector !== signal.primaryVector) {
        return false;
      }
      
      // Must have similar content
      const similarity = this.calculateContentSimilarity(signal, existing);
      if (similarity < 0.3) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Calculate content similarity
   */
  private calculateContentSimilarity(
    signal1: StructuredSignal,
    signal2: StructuredSignal
  ): number {
    const words1 = new Set(signal1.headline.toLowerCase().split(/\s+/));
    const words2 = new Set(signal2.headline.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate decay for old signals
   */
  calculateDecay(
    signal: StructuredSignal,
    currentDate: Date,
    rule: PersistenceRule = this.defaultRule
  ): number {
    const daysSinceDetection = (currentDate.getTime() - signal.detectedAt.getTime()) / (1000 * 60 * 60 * 24);
    const decayFactor = Math.exp(-rule.decayRatePerDay * daysSinceDetection);
    return Math.max(decayFactor, 0);
  }
}