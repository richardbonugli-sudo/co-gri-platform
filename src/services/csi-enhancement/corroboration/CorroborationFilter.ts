/**
 * Corroboration Filter
 * Validates signals through multi-source corroboration
 */

import type { StructuredSignal, CorroborationResult } from '@/types/csi-enhancement/signals';

export interface CorroborationRule {
  minSources: number;
  timeWindowHours: number;
  minCombinedCredibility: number;
  requireGeographicMatch: boolean;
  requireVectorMatch: boolean;
}

export class CorroborationFilter {
  private defaultRule: CorroborationRule = {
    minSources: 2,
    timeWindowHours: 72,
    minCombinedCredibility: 1.5,
    requireGeographicMatch: true,
    requireVectorMatch: true
  };

  /**
   * Check if signal is corroborated
   */
  async checkCorroboration(
    signal: StructuredSignal,
    existingSignals: StructuredSignal[],
    rule: CorroborationRule = this.defaultRule
  ): Promise<CorroborationResult> {
    // Find similar signals within time window
    const similarSignals = this.findSimilarSignals(signal, existingSignals, rule);
    
    // Calculate combined credibility
    const combinedCredibility = this.calculateCombinedCredibility(signal, similarSignals);
    
    // Calculate consistency score
    const consistencyScore = this.calculateConsistencyScore(signal, similarSignals, rule);
    
    // Find conflicting signals
    const conflictingSignals = this.findConflictingSignals(signal, existingSignals);
    
    // Determine if corroborated
    const isCorroborated = 
      similarSignals.length + 1 >= rule.minSources &&
      combinedCredibility >= rule.minCombinedCredibility &&
      consistencyScore >= 0.7;
    
    return {
      isCorroborated,
      sourceCount: similarSignals.length + 1,
      combinedCredibility,
      firstDetected: this.getFirstDetected(signal, similarSignals),
      lastDetected: this.getLastDetected(signal, similarSignals),
      consistencyScore,
      conflictingSignals
    };
  }

  /**
   * Find similar signals
   */
  private findSimilarSignals(
    signal: StructuredSignal,
    existingSignals: StructuredSignal[],
    rule: CorroborationRule
  ): StructuredSignal[] {
    const timeWindowMs = rule.timeWindowHours * 60 * 60 * 1000;
    const signalTime = signal.detectedAt.getTime();
    
    return existingSignals.filter(existing => {
      // Different source required
      if (existing.sourceId === signal.sourceId) {
        return false;
      }
      
      // Within time window
      const timeDiff = Math.abs(existing.detectedAt.getTime() - signalTime);
      if (timeDiff > timeWindowMs) {
        return false;
      }
      
      // Geographic match
      if (rule.requireGeographicMatch) {
        const hasCommonCountry = signal.countries.some(c => 
          existing.countries.includes(c)
        );
        if (!hasCommonCountry) {
          return false;
        }
      }
      
      // Vector match
      if (rule.requireVectorMatch) {
        if (existing.primaryVector !== signal.primaryVector) {
          return false;
        }
      }
      
      // Content similarity (basic check)
      const similarity = this.calculateContentSimilarity(signal, existing);
      if (similarity < 0.3) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Calculate combined credibility
   */
  private calculateCombinedCredibility(
    signal: StructuredSignal,
    similarSignals: StructuredSignal[]
  ): number {
    const allSignals = [signal, ...similarSignals];
    return allSignals.reduce((sum, s) => sum + s.sourceCredibility, 0);
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(
    signal: StructuredSignal,
    similarSignals: StructuredSignal[],
    rule: CorroborationRule
  ): number {
    if (similarSignals.length === 0) {
      return 0;
    }
    
    let totalScore = 0;
    let checks = 0;
    
    // Geographic consistency
    if (rule.requireGeographicMatch) {
      const geographicScore = this.calculateGeographicConsistency(signal, similarSignals);
      totalScore += geographicScore;
      checks++;
    }
    
    // Vector consistency
    if (rule.requireVectorMatch) {
      const vectorScore = this.calculateVectorConsistency(signal, similarSignals);
      totalScore += vectorScore;
      checks++;
    }
    
    // Severity consistency
    const severityScore = this.calculateSeverityConsistency(signal, similarSignals);
    totalScore += severityScore;
    checks++;
    
    return checks > 0 ? totalScore / checks : 0;
  }

  /**
   * Calculate geographic consistency
   */
  private calculateGeographicConsistency(
    signal: StructuredSignal,
    similarSignals: StructuredSignal[]
  ): number {
    const signalCountries = new Set(signal.countries);
    let matchCount = 0;
    
    for (const similar of similarSignals) {
      const commonCountries = similar.countries.filter(c => signalCountries.has(c));
      const matchRatio = commonCountries.length / Math.max(signal.countries.length, similar.countries.length);
      matchCount += matchRatio;
    }
    
    return similarSignals.length > 0 ? matchCount / similarSignals.length : 0;
  }

  /**
   * Calculate vector consistency
   */
  private calculateVectorConsistency(
    signal: StructuredSignal,
    similarSignals: StructuredSignal[]
  ): number {
    const matchCount = similarSignals.filter(s => 
      s.primaryVector === signal.primaryVector
    ).length;
    
    return similarSignals.length > 0 ? matchCount / similarSignals.length : 0;
  }

  /**
   * Calculate severity consistency
   */
  private calculateSeverityConsistency(
    signal: StructuredSignal,
    similarSignals: StructuredSignal[]
  ): number {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const signalLevel = severityLevels[signal.severity];
    
    let totalDiff = 0;
    for (const similar of similarSignals) {
      const similarLevel = severityLevels[similar.severity];
      const diff = Math.abs(signalLevel - similarLevel);
      totalDiff += diff;
    }
    
    const avgDiff = similarSignals.length > 0 ? totalDiff / similarSignals.length : 0;
    return Math.max(0, 1 - avgDiff / 3); // Normalize to 0-1
  }

  /**
   * Calculate content similarity
   */
  private calculateContentSimilarity(
    signal1: StructuredSignal,
    signal2: StructuredSignal
  ): number {
    // Simple word overlap similarity
    const words1 = new Set(signal1.headline.toLowerCase().split(/\s+/));
    const words2 = new Set(signal2.headline.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Find conflicting signals
   */
  private findConflictingSignals(
    signal: StructuredSignal,
    existingSignals: StructuredSignal[]
  ): StructuredSignal[] {
    // Signals that contradict the current signal
    // For now, return empty array (can be enhanced)
    return [];
  }

  /**
   * Get first detected timestamp
   */
  private getFirstDetected(
    signal: StructuredSignal,
    similarSignals: StructuredSignal[]
  ): Date {
    const allSignals = [signal, ...similarSignals];
    return new Date(Math.min(...allSignals.map(s => s.detectedAt.getTime())));
  }

  /**
   * Get last detected timestamp
   */
  private getLastDetected(
    signal: StructuredSignal,
    similarSignals: StructuredSignal[]
  ): Date {
    const allSignals = [signal, ...similarSignals];
    return new Date(Math.max(...allSignals.map(s => s.detectedAt.getTime())));
  }
}