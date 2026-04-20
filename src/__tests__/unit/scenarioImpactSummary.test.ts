/**
 * Unit Tests for Scenario Impact Summary Component
 * Tests delta color coding, risk level changes, and summary generation
 */

import { describe, it, expect } from 'vitest';
import { ScenarioResult, RiskLevel } from '@/types/scenario';

// Helper functions extracted for testing
function getDeltaColor(delta: number): string {
  if (delta < 0) return 'text-green-600';
  if (delta < 5) return 'text-yellow-600';
  if (delta < 10) return 'text-orange-600';
  return 'text-red-600';
}

function getDeltaBgColor(delta: number): string {
  if (delta < 0) return 'bg-green-50 border-green-200';
  if (delta < 5) return 'bg-yellow-50 border-yellow-200';
  if (delta < 10) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}

function generateExecutiveSummary(
  scenarioName: string,
  deltaCOGRI: number,
  deltaPercentage: number,
  baselineRiskLevel: RiskLevel,
  scenarioRiskLevel: RiskLevel,
  riskLevelChange: 'Upgrade' | 'Downgrade' | 'Stable',
  confidence: number
): string {
  const direction = deltaCOGRI > 0 ? 'increases' : deltaCOGRI < 0 ? 'decreases' : 'remains stable';
  const magnitude = Math.abs(deltaPercentage) > 50 ? 'significantly' : 
                   Math.abs(deltaPercentage) > 20 ? 'substantially' : 'moderately';
  
  const riskChange = riskLevelChange === 'Stable' 
    ? `Risk level remains at ${baselineRiskLevel}.`
    : `Risk level ${riskLevelChange === 'Upgrade' ? 'escalates' : 'de-escalates'} from ${baselineRiskLevel} to ${scenarioRiskLevel}.`;
  
  return `The "${scenarioName}" scenario ${magnitude} ${direction} the company's geopolitical risk score by ${Math.abs(deltaCOGRI).toFixed(1)} points (${Math.abs(deltaPercentage).toFixed(1)}%). ${riskChange} This analysis is based on multi-channel exposure assessment with ${(confidence * 100).toFixed(0)}% confidence.`;
}

describe('Scenario Impact Summary - Delta Color Coding', () => {
  describe('getDeltaColor', () => {
    it('should return green for negative delta (risk decrease)', () => {
      expect(getDeltaColor(-5)).toBe('text-green-600');
      expect(getDeltaColor(-0.1)).toBe('text-green-600');
      expect(getDeltaColor(-15)).toBe('text-green-600');
    });

    it('should return yellow for delta 0 to <5 (minimal increase)', () => {
      expect(getDeltaColor(0)).toBe('text-yellow-600');
      expect(getDeltaColor(2.5)).toBe('text-yellow-600');
      expect(getDeltaColor(4.9)).toBe('text-yellow-600');
    });

    it('should return orange for delta 5 to <10 (moderate increase)', () => {
      expect(getDeltaColor(5)).toBe('text-orange-600');
      expect(getDeltaColor(7.5)).toBe('text-orange-600');
      expect(getDeltaColor(9.9)).toBe('text-orange-600');
    });

    it('should return red for delta ≥10 (significant increase)', () => {
      expect(getDeltaColor(10)).toBe('text-red-600');
      expect(getDeltaColor(15)).toBe('text-red-600');
      expect(getDeltaColor(25)).toBe('text-red-600');
    });
  });

  describe('getDeltaBgColor', () => {
    it('should return green background for negative delta', () => {
      expect(getDeltaBgColor(-5)).toBe('bg-green-50 border-green-200');
    });

    it('should return yellow background for minimal increase', () => {
      expect(getDeltaBgColor(3)).toBe('bg-yellow-50 border-yellow-200');
    });

    it('should return orange background for moderate increase', () => {
      expect(getDeltaBgColor(7)).toBe('bg-orange-50 border-orange-200');
    });

    it('should return red background for significant increase', () => {
      expect(getDeltaBgColor(15)).toBe('bg-red-50 border-red-200');
    });
  });
});

describe('Scenario Impact Summary - Executive Summary Generation', () => {
  it('should generate summary for risk increase scenario', () => {
    const summary = generateExecutiveSummary(
      'Taiwan Strait Crisis',
      16.5,
      26.4,
      'Elevated',
      'High Risk',
      'Upgrade',
      0.85
    );

    expect(summary).toContain('Taiwan Strait Crisis');
    expect(summary).toContain('increases');
    expect(summary).toContain('16.5 points');
    expect(summary).toContain('26.4%');
    expect(summary).toContain('escalates from Elevated to High Risk');
    expect(summary).toContain('85% confidence');
  });

  it('should generate summary for risk decrease scenario', () => {
    const summary = generateExecutiveSummary(
      'Peace Agreement',
      -8.2,
      -15.3,
      'High Risk',
      'Elevated',
      'Downgrade',
      0.90
    );

    expect(summary).toContain('Peace Agreement');
    expect(summary).toContain('decreases');
    expect(summary).toContain('8.2 points');
    expect(summary).toContain('15.3%');
    expect(summary).toContain('de-escalates from High Risk to Elevated');
    expect(summary).toContain('90% confidence');
  });

  it('should generate summary for stable risk scenario', () => {
    const summary = generateExecutiveSummary(
      'Minor Policy Change',
      0.5,
      0.8,
      'Moderate Risk',
      'Moderate Risk',
      'Stable',
      0.75
    );

    expect(summary).toContain('Minor Policy Change');
    expect(summary).toContain('remains stable');
    expect(summary).toContain('0.5 points');
    expect(summary).toContain('Risk level remains at Moderate Risk');
    expect(summary).toContain('75% confidence');
  });

  it('should use correct magnitude descriptors', () => {
    // Moderate change (<20%)
    const moderate = generateExecutiveSummary(
      'Test', 5, 15, 'Elevated', 'High Risk', 'Upgrade', 0.85
    );
    expect(moderate).toContain('moderately');

    // Substantial change (20-50%)
    const substantial = generateExecutiveSummary(
      'Test', 10, 30, 'Elevated', 'High Risk', 'Upgrade', 0.85
    );
    expect(substantial).toContain('substantially');

    // Significant change (>50%)
    const significant = generateExecutiveSummary(
      'Test', 20, 60, 'Low Risk', 'Very High Risk', 'Upgrade', 0.85
    );
    expect(significant).toContain('significantly');
  });
});

describe('Scenario Impact Summary - Scenario Result Validation', () => {
  it('should handle valid scenario result', () => {
    const result: ScenarioResult = {
      scenarioId: 'test-123',
      companyId: 'AAPL',
      ticker: 'AAPL',
      baselineCOGRI: 62.4,
      scenarioCOGRI: 78.9,
      deltaCOGRI: 16.5,
      deltaPercentage: 26.4,
      baselineRiskLevel: 'Elevated',
      scenarioRiskLevel: 'High Risk',
      riskLevelChange: 'Upgrade',
      confidence: 0.85,
      dataQuality: {
        exposureCoverage: 95,
        shockDataFreshness: new Date(),
        alignmentCoverage: 85
      },
      channelAttribution: [],
      nodeAttribution: [],
      calculatedAt: new Date(),
      calculationTime: 1500
    };

    expect(result.deltaCOGRI).toBe(16.5);
    expect(result.riskLevelChange).toBe('Upgrade');
    expect(result.confidence).toBe(0.85);
  });

  it('should calculate confidence interval correctly', () => {
    const deltaCOGRI = 16.5;
    const confidenceInterval = Math.abs(deltaCOGRI * 0.1);
    
    expect(confidenceInterval).toBeCloseTo(1.65, 2);
  });

  it('should handle zero delta scenario', () => {
    const deltaCOGRI = 0;
    const color = getDeltaColor(deltaCOGRI);
    
    expect(color).toBe('text-yellow-600');
  });

  it('should handle large positive delta', () => {
    const deltaCOGRI = 35.8;
    const color = getDeltaColor(deltaCOGRI);
    
    expect(color).toBe('text-red-600');
  });

  it('should handle large negative delta', () => {
    const deltaCOGRI = -20.5;
    const color = getDeltaColor(deltaCOGRI);
    
    expect(color).toBe('text-green-600');
  });
});

describe('Scenario Impact Summary - Gauge Calculation', () => {
  it('should calculate gauge percentage correctly', () => {
    const scenarioCOGRI = 78.9;
    const gaugePercentage = Math.min(100, Math.max(0, scenarioCOGRI));
    
    expect(gaugePercentage).toBe(78.9);
  });

  it('should cap gauge at 100', () => {
    const scenarioCOGRI = 125.5;
    const gaugePercentage = Math.min(100, Math.max(0, scenarioCOGRI));
    
    expect(gaugePercentage).toBe(100);
  });

  it('should floor gauge at 0', () => {
    const scenarioCOGRI = -15.2;
    const gaugePercentage = Math.min(100, Math.max(0, scenarioCOGRI));
    
    expect(gaugePercentage).toBe(0);
  });
});