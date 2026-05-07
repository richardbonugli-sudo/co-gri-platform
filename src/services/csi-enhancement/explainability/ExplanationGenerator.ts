/**
 * Explanation Generator
 * Generates human-readable explanations for CSI scores
 */

import type { StructuredSignal } from '@/types/csi-enhancement/signals';
import { RISK_VECTORS } from '@/types/csi-enhancement/signals';

export class ExplanationGenerator {
  /**
   * Generate explanation for enhanced CSI score
   */
  generateExplanation(
    country: string,
    vector: string,
    legacyCSI: number,
    baselineDrift: number,
    topSignals: StructuredSignal[]
  ): string {
    const vectorName = RISK_VECTORS[vector as keyof typeof RISK_VECTORS];
    const driftDirection = baselineDrift > 0 ? 'increased' : baselineDrift < 0 ? 'decreased' : 'unchanged';
    const driftMagnitude = Math.abs(baselineDrift).toFixed(1);

    let explanation = '';

    // Header
    if (baselineDrift !== 0) {
      explanation += `${country} ${vectorName} CSI ${driftDirection} by ${driftMagnitude} points.\n\n`;
    } else {
      explanation += `${country} ${vectorName} CSI remains stable at ${legacyCSI.toFixed(1)}.\n\n`;
    }

    // Contributing signals
    if (topSignals.length > 0) {
      explanation += 'Key Contributing Signals:\n';
      topSignals.forEach((signal, i) => {
        const age = this.getSignalAge(signal.detectedAt);
        explanation += `${i + 1}. ${signal.headline}\n`;
        explanation += `   Source: ${signal.sourceId} | Severity: ${signal.severity} | ${age}\n`;
      });
    } else {
      explanation += 'No recent signals detected.\n';
    }

    // Summary
    explanation += `\nLegacy CSI: ${legacyCSI.toFixed(1)} → Enhanced CSI: ${(legacyCSI + baselineDrift).toFixed(1)}`;

    return explanation;
  }

  /**
   * Generate detailed explanation with signal contributions
   */
  generateDetailedExplanation(
    country: string,
    vector: string,
    legacyCSI: number,
    baselineDrift: number,
    signals: StructuredSignal[],
    contributions: { signal: StructuredSignal; impact: number; decay: number; contribution: number }[]
  ): string {
    const vectorName = RISK_VECTORS[vector as keyof typeof RISK_VECTORS];
    
    let explanation = `# ${country} - ${vectorName} CSI Analysis\n\n`;

    // Score summary
    explanation += `## Score Summary\n`;
    explanation += `- **Legacy CSI:** ${legacyCSI.toFixed(1)}\n`;
    explanation += `- **Baseline Drift:** ${baselineDrift >= 0 ? '+' : ''}${baselineDrift.toFixed(1)}\n`;
    explanation += `- **Enhanced CSI:** ${(legacyCSI + baselineDrift).toFixed(1)}\n\n`;

    // Signal breakdown
    explanation += `## Signal Contributions (${contributions.length} signals)\n\n`;

    contributions.forEach((contrib, i) => {
      const signal = contrib.signal;
      const age = this.getSignalAge(signal.detectedAt);
      
      explanation += `### ${i + 1}. ${signal.headline}\n`;
      explanation += `- **Impact Score:** ${contrib.impact.toFixed(2)}\n`;
      explanation += `- **Decay Factor:** ${(contrib.decay * 100).toFixed(1)}%\n`;
      explanation += `- **Contribution:** ${contrib.contribution >= 0 ? '+' : ''}${contrib.contribution.toFixed(2)}\n`;
      explanation += `- **Source:** ${signal.sourceId} (credibility: ${(signal.sourceCredibility * 100).toFixed(0)}%)\n`;
      explanation += `- **Severity:** ${signal.severity}\n`;
      explanation += `- **Age:** ${age}\n`;
      explanation += `- **Summary:** ${signal.summary.substring(0, 200)}...\n\n`;
    });

    // Methodology
    explanation += `## Methodology\n`;
    explanation += `Enhanced CSI incorporates forward-looking expectations from qualified geopolitical signals.\n`;
    explanation += `Each signal's contribution decays exponentially with a 3-month half-life.\n`;
    explanation += `Total drift is capped at ±10 points to prevent extreme volatility.\n`;

    return explanation;
  }

  /**
   * Generate comparison explanation
   */
  generateComparisonExplanation(
    country: string,
    legacyScores: Record<string, number>,
    enhancedScores: Record<string, number>
  ): string {
    let explanation = `# ${country} CSI Comparison\n\n`;
    explanation += `## Legacy vs Enhanced CSI\n\n`;

    const vectors = Object.keys(legacyScores);
    
    explanation += `| Vector | Legacy | Enhanced | Drift | Change |\n`;
    explanation += `|--------|--------|----------|-------|--------|\n`;

    for (const vector of vectors) {
      const legacy = legacyScores[vector];
      const enhanced = enhancedScores[vector];
      const drift = enhanced - legacy;
      const change = drift > 0 ? '↑' : drift < 0 ? '↓' : '→';
      
      const vectorName = RISK_VECTORS[vector as keyof typeof RISK_VECTORS];
      explanation += `| ${vectorName} | ${legacy.toFixed(1)} | ${enhanced.toFixed(1)} | ${drift >= 0 ? '+' : ''}${drift.toFixed(1)} | ${change} |\n`;
    }

    explanation += `\n`;
    explanation += `**Key Insights:**\n`;
    
    // Find largest changes
    const changes = vectors.map(v => ({
      vector: v,
      drift: enhancedScores[v] - legacyScores[v]
    })).sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift));

    if (changes[0] && Math.abs(changes[0].drift) > 2) {
      const vectorName = RISK_VECTORS[changes[0].vector as keyof typeof RISK_VECTORS];
      explanation += `- Largest change in ${vectorName} (${changes[0].drift >= 0 ? '+' : ''}${changes[0].drift.toFixed(1)} points)\n`;
    }

    const avgDrift = vectors.reduce((sum, v) => sum + (enhancedScores[v] - legacyScores[v]), 0) / vectors.length;
    explanation += `- Average drift across all vectors: ${avgDrift >= 0 ? '+' : ''}${avgDrift.toFixed(1)} points\n`;

    return explanation;
  }

  /**
   * Get human-readable signal age
   */
  private getSignalAge(detectedAt: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - detectedAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays === 0) {
      if (diffHours === 0) {
        return 'less than 1 hour ago';
      }
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }

    if (diffDays === 1) {
      return 'yesterday';
    }

    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) {
      return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  }
}